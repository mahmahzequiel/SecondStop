<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    /**
     * Display the cart items for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Get the user's cart; if none exists, return an empty collection.
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $cartItems = $cart->cartItems()->with('product')->get();
        
        return response()->json($cartItems);
    }

    /**
     * Add a product to the authenticated user's cart.
     */
    public function addToCart(Request $request)
    {
        $validatedData = $request->validate([
            'product_id' => 'required|exists:products,id',
            // Optionally include 'quantity' if not provided, default to 1.
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Get or create the cart for the user.
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        // Check if the product is already in the cart.
        $existingItem = $cart->cartItems()->where('product_id', $validatedData['product_id'])->first();
        if ($existingItem) {
            return response()->json(['message' => 'Item is already in the cart'], 409);
        }

        // Create a new CartItem.
        $cartItem = CartItem::create([
            'cart_id'    => $cart->id,
            'product_id' => $validatedData['product_id'],
            'quantity'   => $request->input('quantity', 1)
        ]);

        return response()->json(['message' => 'Product added to cart successfully', 'cart_item' => $cartItem], 201);
    }

    /**
     * Remove a specific cart item for the authenticated user.
     */
    public function destroy($id)
    {
        $cartItem = CartItem::where('id', $id)
            ->whereHas('cart', function($query) {
                $query->where('user_id', Auth::id());
            })->first();

        if (!$cartItem) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        $cartItem->delete();
        return response()->json(['message' => 'Item removed from cart']);
    }

    /**
     * Bulk delete cart items.
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'cart_item_ids' => 'required|array',
            'cart_item_ids.*' => 'exists:cart_items,id',
        ]);

        $user = Auth::id();
        CartItem::whereIn('id', $request->cart_item_ids)
            ->whereHas('cart', function($query) use ($user) {
                $query->where('user_id', $user);
            })->delete();

        return response()->json(['message' => 'Selected cart items removed successfully']);
    }
}
