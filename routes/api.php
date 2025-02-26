<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiController;
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

// Open Routes
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);

// Public Product API
Route::resource("products", ProductsController::class);
Route::resource('categories', CategoryController::class);
Route::get("category-types", [CategoryTypeController::class, "index"]);
Route::get("/products-by-category-type", [ProductsController::class, "getProductsByCategoryType"]);
Route::resource('brands', BrandController::class);

// Address Routes
Route::get('address', [AddressController::class, 'index']);
Route::get('address/user/{userId}', [AddressController::class, 'getByUser']);
Route::post('address/{id}', [AddressController::class, 'update']); 

// Order and Payment Routes
Route::apiResource('orders', OrderController::class);
Route::apiResource('payments', PaymentController::class);

// Cart, Shipping, and Purchase Routes
// Route::post('carts', [CartController::class, 'addToCart']);
// Route::get('carts', [CartController::class, 'index']);


Route::apiResource('shippings', ShippingController::class);
Route::apiResource('purchases', PurchaseController::class);

// Protected Routes
Route::group(["middleware" => ["auth:api"]], function() {
    Route::get("profile", [ApiController::class, "profile"]);
    Route::put("profile/update", [ApiController::class, "updateProfile"]);
    Route::post("logout", [ApiController::class, "logout"]);

    Route::post('carts', [CartController::class, 'addToCart']);
    Route::get('carts', [CartController::class, 'index']);

});
