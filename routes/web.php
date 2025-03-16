<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\ChatController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Broadcast authentication routes - important for private channels
Broadcast::routes(['middleware' => ['auth:sanctum']]);

Route::get('/', function () {
    return view('welcome');
});

// Chat web routes (if you need them)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/chat', function () {
        return view('chat');
    });
});

// Catch all other routes and direct them to the welcome view
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');