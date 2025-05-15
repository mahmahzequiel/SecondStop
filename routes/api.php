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
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SacksController; // Add this line
use App\Http\Controllers\StoreReviewsController;
use App\Http\Controllers\AdminDashboardController; // Add this line




// Open Routes: Registration and Login
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);
Route::post('forgot-password', [ApiController::class, 'forgotPassword']);
Route::post('reset-password', [ApiController::class, 'resetPassword']);

// Public Product API Routes
Route::apiResource('/roles', RoleController::class);
Route::put('/roles/{id}/archive', [RoleController::class, 'archive']);
Route::put('/roles/{id}/restore', [RoleController::class, 'restore']);

Route::post('sacks/bulk-delete', [SacksController::class, 'bulkDelete']);
Route::post('sacks/bulk-restore', [SacksController::class, 'bulkRestore']);
Route::put('sacks/{id}/restore', [SacksController::class, 'restore']);
Route::apiResource('sacks', SacksController::class);
Route::post('sacks/update-quantities', [SacksController::class, 'updateQuantities']);

Route::put('/products/{id}/restore', [ProductsController::class, 'restore']);
Route::resource("products", ProductsController::class);
Route::post('/products/update-quantities', [ProductsController::class, 'updateQuantities']);


Route::put('/categories/{id}/restore', [CategoryController::class, 'restore']);
Route::apiResource('categories', CategoryController::class);

Route::get("category-types", [CategoryTypeController::class, "index"]);
Route::put("category-types/{categoryType}", [CategoryTypeController::class, "update"]);
Route::post("category-types", [CategoryTypeController::class, "store"]);
Route::delete("category-types/{categoryType}", [CategoryTypeController::class, "destroy"]);
Route::put("category-types/{id}/restore", [CategoryTypeController::class, "restore"]);

Route::get("/products-by-category-type", [ProductsController::class, "getProductsByCategoryType"]);

Route::resource('brands', BrandController::class);
Route::put('/brands/{id}/restore', [BrandController::class, 'restore']);

// Public Address Routes
Route::get('address', [AddressController::class, 'index']);
Route::get('address/user/{userId}', [AddressController::class, 'getByUser']);

// Protected Routes (Require auth:api)
Route::group(["middleware" => ["auth:api"]], function() {

    Route::post('change-password', [ApiController::class, 'changePassword']);

    // User Profile Routes
    Route::get("profile", [ApiController::class, "profile"]);
    Route::post("logout", [ApiController::class, "logout"]);
    Route::post("profile/update", [ApiController::class, "updateProfile"]);
    


    // Cart Routes
    Route::post('carts', [CartController::class, 'addToCart']);
    Route::get('carts', [CartController::class, 'index']);
    Route::post('/carts/delete', [CartController::class, 'bulkDestroy']);

    // Protected Address Routes
    Route::get('address', [AddressController::class, 'index']);
    Route::post('/address', [AddressController::class, 'store']);
    Route::put('/address/{id}', [AddressController::class, 'update']);
    Route::delete('/address/{id}', [AddressController::class, 'destroy']);
    Route::get('/address/archived', [AddressController::class, 'archived']);
    Route::put('/address/restore/{id}', [AddressController::class, 'restore']);

    // Chat Routes
    // Chat Routes
Route::post('/chat/send', [ChatController::class, 'sendMessage']);
// Route::get('/chat/messages/{otherUserId}', [ChatController::class, 'getMessagesWithUserData']);
Route::post('/chat/mark-read/{senderId}', [ChatController::class, 'markAsRead']);
Route::get('/chat/messages/{userId}', [ChatController::class, 'getMessagesWithUserData']);
Route::get('/chat/customer/messages', [ChatController::class, 'getCustomerMessages']);

// For admin users only
Route::get('/chat/customer-chats', [ChatController::class, 'getAllCustomerChats']);
Route::get('/chat/conversations', [ChatController::class, 'getConversations']);

    // Admin Routes
    Route::put('/users/{id}/archive', [UserController::class, 'archive']);
    Route::put('/users/{id}/restore', [UserController::class, 'restore']);
    Route::put('/users/bulk-archive-restore', [UserController::class, 'bulkArchiveRestore']);
    Route::get("users", [ApiController::class, "getAllUsers"]);
    Route::get('/users', [UserController::class, 'index']);

    // Order Routes
Route::apiResource('orders', OrderController::class);
// Change these routes to point to the request methods
// Add this above or below your other order routes
Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
Route::post('orders/{order}/request-cancellation', [OrderController::class, 'requestCancellation'])->name('orders.request-cancellation');
Route::post('orders/{order}/request-refund', [OrderController::class, 'requestRefund'])->name('orders.request-refund');
// Keep the direct delivery method
Route::post('orders/{order}/deliver', [OrderController::class, 'markAsDelivered'])->name('orders.deliver');
Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
Route::post('orders/bulk-action', [OrderController::class, 'bulkAction'])->name('orders.bulk-action');
Route::post('orders/bulk-payment-action', [OrderController::class, 'bulkPaymentAction'])->name('orders.bulk-payment-action');

// Admin approval routes - ensure these are protected by admin middleware
Route::post('orders/{order}/approve-cancellation', [OrderController::class, 'approveCancellation'])->name('orders.approve-cancellation');
Route::post('orders/{order}/deny-cancellation', [OrderController::class, 'denyCancellation'])->name('orders.deny-cancellation');
Route::post('orders/{order}/approve-refund', [OrderController::class, 'approveRefund'])->name('orders.approve-refund');
Route::post('orders/{order}/deny-refund', [OrderController::class, 'denyRefund'])->name('orders.deny-refund');
Route::patch('/orders/{order}/payment-status', [OrderController::class, 'updatePaymentStatus'])->name('orders.update-payment-status');

    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('shippings', ShippingController::class);
    Route::apiResource('purchases', PurchaseController::class);

    Route::apiResource('store-reviews', StoreReviewsController::class);

    // Notification Routes (using singular 'notification')
    Route::post('notification', [NotificationController::class, 'store']);
    Route::get('notification', [NotificationController::class, 'index']);
    Route::patch('notification/{id}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::put('notification/mark-all-read', [NotificationController::class, 'markAllAsRead']); 

    Route::group(['prefix' => '/dashboard'], function() {
        Route::get('stats', [AdminDashboardController::class, 'getStats']);
        Route::get('sales', [AdminDashboardController::class, 'getSalesData']);
        Route::get('order-status', [AdminDashboardController::class, 'getOrderStatusDistribution']);
        Route::get('product-categories', [AdminDashboardController::class, 'getProductCategoryDistribution']);
        Route::get('product-category-types', [AdminDashboardController::class, 'getProductCategoryTypeDistribution']);
    });


});