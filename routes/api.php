<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CategoryTypeController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\AddressController;

// Open Routes
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);

// Public Product API
Route::resource("products", ProductsController::class);
Route::resource('categories', CategoryController::class);
Route::get("category-types", [CategoryTypeController::class, "index"]);
Route::get("/products-by-category-type", [ProductsController::class, "getProductsByCategoryType"]);
Route::resource('brands', BrandController::class);

Route::get('address', [AddressController::class, 'index']);
Route::get('address/user/{userId}', [AddressController::class, 'getByUser']);
Route::post('address/{id}', [AddressController::class, 'update']);

// Protected Routes (Require auth:api)
Route::group(["middleware" => ["auth:api"]], function() {
    Route::get("profile", [ApiController::class, "profile"]);
    Route::put("profile/update", [ApiController::class, "updateProfile"]);
    Route::post("logout", [ApiController::class, "logout"]);

    // ✅ NEW: Only admins can fetch all users
    Route::get("users", [ApiController::class, "getAllUsers"]);
});
