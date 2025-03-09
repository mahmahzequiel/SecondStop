<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CategoryTypeController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ShippingController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application.
|
*/

// Open Routes: Registration and Login
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);

// Public Product API Routes
Route::put('/products/{id}/restore', [ProductsController::class, 'restore']);
Route::resource("products", ProductsController::class);
Route::resource('categories', CategoryController::class);
Route::get("category-types", [CategoryTypeController::class, "index"]);
Route::get("/products-by-category-type", [ProductsController::class, "getProductsByCategoryType"]);
Route::resource('brands', BrandController::class);

// Public Address Routes
Route::get('address', [AddressController::class, 'index']);
Route::get('address/user/{userId}', [AddressController::class, 'getByUser']);
Route::post('address/{id}', [AddressController::class, 'update']);

// Protected Routes (Require auth:api)
Route::group(["middleware" => ["auth:api"]], function() {
    // User Profile Routes
    Route::get("profile", [ApiController::class, "profile"]);
    Route::post("logout", [ApiController::class, "logout"]);
    Route::post("profile/update", [ApiController::class, "updateProfile"]);
    Route::put("profile/update", [ApiController::class, "updateProfile"]);

    // Cart Routes
    Route::post('carts', [CartController::class, 'addToCart']);
    Route::get('carts', [CartController::class, 'index']);
    Route::post('/carts/delete', [CartController::class, 'bulkDestroy']);

    // Protected Address Routes
    Route::post('/address', [AddressController::class, 'storeOrUpdate']);

    // Chat Routes
    Route::get('chat/{otherUserId}', [ChatController::class, 'getMessages']);
    Route::post('chat/send', [ChatController::class, 'sendMessage']);
    Route::get('chat/customer-chats', [ChatController::class, 'getAllCustomerChats']);

    // Admin Routes
    Route::put('/users/{id}/archive', [UserController::class, 'archive']);
Route::put('/users/{id}/restore', [UserController::class, 'restore']);
Route::put('/users/bulk-archive-restore', [UserController::class, 'bulkArchiveRestore']);
    Route::get("users", [ApiController::class, "getAllUsers"]);
    Route::get('/users', [UserController::class, 'index']);

    // Order Routes (Now Protected)
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('shippings', ShippingController::class);
    Route::apiResource('purchases', PurchaseController::class);

    // Notification Routes (using singular 'notification')
    Route::post('notification', [NotificationController::class, 'store']);
    Route::get('notification', [NotificationController::class, 'index']);
    Route::patch('notification/{id}/mark-read', [NotificationController::class, 'markAsRead']);
});
