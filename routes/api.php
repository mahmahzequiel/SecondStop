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

// Open Routes
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);

// Public Product API
Route::put('/products/{id}/restore', [ProductsController::class, 'restore']);
Route::resource("products", ProductsController::class);
Route::resource('categories', CategoryController::class);
Route::get("category-types", [CategoryTypeController::class, "index"]);
Route::get("/products-by-category-type", [ProductsController::class, "getProductsByCategoryType"]);
Route::resource('brands', BrandController::class);

// Public Order and Payment Routes
Route::apiResource('orders', OrderController::class);
Route::apiResource('payments', PaymentController::class);
Route::apiResource('shippings', ShippingController::class);
Route::apiResource('purchases', PurchaseController::class);

// Public Address Routes
Route::get('address', [AddressController::class, 'index']);
Route::get('address/user/{userId}', [AddressController::class, 'getByUser']);
Route::post('address/{id}', [AddressController::class, 'update']);

// Protected Routes (Require auth:api)
Route::group(["middleware" => ["auth:api"]], function() {
    // User Profile Routes
    Route::get("profile", [\App\Http\Controllers\Api\ApiController::class, "profile"]);
    Route::put("profile/update", [\App\Http\Controllers\Api\ApiController::class, "updateProfile"]);
    Route::post("logout", [\App\Http\Controllers\Api\ApiController::class, "logout"]);

    // Cart Routes
    Route::post('carts', [\App\Http\Controllers\CartController::class, 'addToCart']);
    Route::get('carts', [\App\Http\Controllers\CartController::class, 'index']);
    Route::post('/carts/delete', [\App\Http\Controllers\CartController::class, 'bulkDestroy']);

    // Protected Address Routes
    Route::post('/address', [\App\Http\Controllers\AddressController::class, 'storeOrUpdate']);

    // Chat Routes
    Route::get('chat/{otherUserId}', [\App\Http\Controllers\ChatController::class, 'getMessages']);
    Route::post('chat/send', [\App\Http\Controllers\ChatController::class, 'sendMessage']);
    Route::get('chat/customer-chats', [\App\Http\Controllers\ChatController::class, 'getAllCustomerChats']);

    // Admin Routes
    Route::get("users", [\App\Http\Controllers\Api\ApiController::class, "getAllUsers"]);

    // Notification Routes (using singular 'notification')
    Route::post('notification', [\App\Http\Controllers\NotificationController::class, 'store']);
    Route::get('notification', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::patch('notification/{id}/mark-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
});
