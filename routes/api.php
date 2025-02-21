<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CategoryTypeController;
use App\Http\Controllers\BrandController;

// Open Routes
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);


// Public Product API
Route::resource("products", ProductsController::class);
Route::resource('categories', CategoryController::class);
Route::get("category-types", [CategoryTypeController::class, "index"]);
Route::get("/products-by-category-type", [ProductsController::class, "getProductsByCategoryType"]); // <-- Added Route
Route::resource('brands', BrandController::class);


// Protected Routes
Route::group(["middleware" => ["auth:sanctum"]], function() {
    Route::get("profile", [ApiController::class, "profile"]);
    Route::put("profile/update", [ApiController::class, "updateProfile"]);
    Route::post("logout", [ApiController::class, "logout"]);
});
