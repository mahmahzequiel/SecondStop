<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\Products;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    /**
     * Display a listing of the cart items.
     */
    public function index(Request $request)
{
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $cartItems = Cart::where('user_id', $user->id)->with('product')->get();
    return response()->json($cartItems);
}


    /**
     * Store a newly created item in the cart.
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id', // ✅ Corrected field name
        ]);

        $cartItem = Cart::create([
            'user_id' => Auth::id(),
            'product_id' => $request->product_id, // ✅ Use product_id
        ]);

        return response()->json(['message' => 'Item added to cart', 'cart' => $cartItem], 201);
    }

    /**
     * Remove the specified item from the cart.
     */
    public function destroy($id)
    {
        $cartItem = Cart::where('id', $id)->where('user_id', Auth::id())->first();

        if (!$cartItem) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        $cartItem->delete();
        return response()->json(['message' => 'Item removed from cart']);
    }

    public function addToCart(Request $request)
{
    $validatedData = $request->validate([
        'user_id' => 'required|exists:users,id',
        'product_id' => 'required|exists:products,id',
    ]);

    // Create cart entry
    $cart = Cart::create([
        'user_id' => Auth::id(), // ✅ Securely use authenticated user ID

        'product_id' => $validatedData['product_id'],
    ]);

    return response()->json(['message' => 'Product added to cart successfully', 'cart' => $cart], 201);
}
public function bulkDestroy(Request $request)
{
    $request->validate([
        'cart_ids' => 'required|array', // Ensure it's an array
        'cart_ids.*' => 'exists:carts,id', // Validate each cart_id
    ]);

    $user = Auth::id();

    // Delete only the cart items belonging to the authenticated user
    Cart::whereIn('id', $request->cart_ids)
        ->where('user_id', $user)
        ->delete();

    return response()->json(['message' => 'Selected cart items removed successfully']);
}


}