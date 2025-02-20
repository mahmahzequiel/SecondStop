<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiController;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\ProfileController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

//Open Routes
Route::post("register", [ApiController::class, "register"]);
Route::post("login", [ApiController::class, "login"]);
Route::apiResource('products', ProductsController::class);
// routes/api.php
// Route::post('/register', [ProfileController::class, 'register']);


//Protected Routes 
Route::group([
    "middleware" => ["auth:api"]
], function(){
    Route::get("profile", [ApiController::class, "profile"]);
    Route::get("logout", [ApiController::class, "logout"]);
});



//Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//    return $request->user();
//});
