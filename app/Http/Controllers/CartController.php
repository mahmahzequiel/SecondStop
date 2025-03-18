<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    /**
     * Display all items in the user's cart
     */
    public function index(Request $request)
{
    try {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }

        // Load cart with items and their product details
        $cart = $user->cart()
                    ->with(['cartItems.product:id,product_name,price,product_image,description'])
                    ->first();

        // Return formatted response even for empty cart
        return response()->json([
            'status' => 'success',
            'data' => $cart ? $cart->cartItems->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'product_name' => $item->product->product_name,
                        'description' => $item->product->description,
                        'price' => $item->product->price,
                        'product_image' => $item->product->product_image 
                            ? asset('storage/' . $item->product->product_image)
                            : null
                    ] : null,
                    'created_at' => $item->created_at
                ];
            }) : []
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch cart items',
            'error' => $e->getMessage()
        ], 500);
    }
}


    /**
     * Add item to cart
     */
    public function addToCart(Request $request)
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id'
            ]);

            $user = Auth::user();
            $cart = $user->cart()->firstOrCreate();

            if ($cart->cartItems()->where('product_id', $request->product_id)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Product already in cart'
                ], 400);
            }

            $cartItem = $cart->cartItems()->create([
                'product_id' => $request->product_id
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Product added to cart',
                'data' => $cartItem->load('product')
            ], 201);

        } catch (\Exception $e) {
            Log::error('Add to Cart Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to add item to cart'
            ], 500);
        }
    }

    /**
     * Remove item from cart
     */
    public function destroy($id)
    {
        try {
            $cartItem = CartItem::where('id', $id)
                ->whereHas('cart', function($query) {
                    $query->where('user_id', Auth::id());
                })
                ->firstOrFail();

            $cartItem->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Item removed from cart'
            ]);

        } catch (\Exception $e) {
            Log::error('Delete Cart Item Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Item not found'
            ], 404);
        }
    }

    /**
     * Bulk remove items from cart
     */
    public function bulkDestroy(Request $request)
{
    try {
        $request->validate([
            'cart_ids' => 'required|array', // Match frontend parameter name
            'cart_ids.*' => 'exists:cart_items,id'
        ]);

        $deleted = CartItem::whereIn('id', $request->cart_ids)
            ->whereHas('cart', function($query) {
                $query->where('user_id', Auth::id());
            })
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Items removed successfully',
            'deleted_count' => $deleted
        ]);

    } catch (\Exception $e) {
        \Log::error('Bulk delete error: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to remove items',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * @deprecated - Use addToCart instead
     */
    public function store(Request $request)
    {
        return response()->json([
            'status' => 'error',
            'message' => 'Method deprecated - Use POST /carts instead'
        ], 410);
    }
}