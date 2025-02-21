<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiController;
use App\Http\Controllers\ProductsController;

// Open Routes
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);

// Public Product API
Route::apiResource("products", ProductsController::class);

// Protected Routes
Route::group(["middleware" => ["auth:api"]], function() {
    Route::get("profile", [ApiController::class, "profile"]);
    Route::put("profile/update", [ApiController::class, "updateProfile"]);
    Route::post("logout", [ApiController::class, "logout"]);
});
