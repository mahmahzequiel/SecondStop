<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Cart;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Display a listing of all orders.
     */
    public function index()
    {
        $orders = Order::with(['cart', 'payment', 'address'])->get();
        return response()->json(['orders' => $orders]);
    }

    /**
     * Store a newly created order and create a notification.
     */
    public function store(Request $request)
    {
        try {
            // Validate the request data
            $validated = $request->validate([
                'cart_id'       => 'required', // can be a single int or array
                'payment_id'    => 'required|exists:payments,id',
                'address_id'    => 'nullable|exists:addresses,id',
                'order_number'  => 'nullable|string|unique:orders,order_number',
                'subtotal'      => 'required|numeric|min:0',
                'shipping_cost' => 'required|numeric|min:0',
                'total_amount'  => 'required|numeric|min:0',
                'status'        => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
                'purchase_date' => 'nullable|date',
            ]);

            // Handle single or multiple cart_ids
            $cartIds = is_array($validated['cart_id'])
                ? $validated['cart_id']
                : [$validated['cart_id']];

            // Validate each cart_id
            foreach ($cartIds as $cartId) {
                if (!Cart::where('id', $cartId)->exists()) {
                    return response()->json(['error' => "Invalid cart_id: $cartId"], 400);
                }
            }

            // Generate order number if not provided
            if (empty($validated['order_number'])) {
                $validated['order_number'] = 'ORD-' . mt_rand(100000, 999999);
            }

            // Create the order
            $order = Order::create($validated);

            // Create Notification (using first cart ID)
            $firstCartId = $cartIds[0];
            $cart = Cart::with('product')->find($firstCartId);

            // Default notification details
            $productImage = null;
            $description  = "Your order has been placed.";

            if ($cart && $cart->product) {
                $product = $cart->product;
                // Here we store exactly what's in product_image, e.g. "images/women/tops/image1.png"
                $productImage = $product->product_image;
                // Build a more detailed description
                $description  = "Your order {$product->product_name} has been placed.\n"
                              . "Price: PHP {$order->total_amount}\n"
                              . "Quantity: 1";
            }

            // Create the notification if user is authenticated
            $user = $request->user();
            if ($user) {
                Notification::create([
                    'user_id'       => $user->id,
                    'order_id'      => $order->id,
                    'title'         => 'Order Placed Successfully',
                    'description'   => $description,
                    'is_read'       => 0,
                    // Store the relative path from product_image
                    'product_image' => $productImage,
                ]);
            }

            return response()->json([
                'message' => 'Order created successfully',
                'order'   => $order
            ], 201);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    /**
     * Display a specific order.
     */
    public function show(Order $order)
    {
        return response()->json(['order' => $order->load(['cart', 'payment', 'address'])]);
    }

    /**
     * Update an existing order.
     */
    public function update(Request $request, Order $order)
    {
        try {
            $validated = $request->validate([
                'cart_id'       => 'required|exists:carts,id',
                'payment_id'    => 'required|exists:payments,id',
                'address_id'    => 'nullable|exists:addresses,id',
                'order_number'  => 'required|string|unique:orders,order_number,' . $order->id,
                'subtotal'      => 'required|numeric|min:0',
                'shipping_cost' => 'required|numeric|min:0',
                'total_amount'  => 'required|numeric|min:0',
                'status'        => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
                'purchase_date' => 'nullable|date',
            ]);

            $order->update($validated);

            return response()->json([
                'message' => 'Order updated successfully',
                'order'   => $order
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    /**
     * Soft-delete or force-delete the specified order.
     */
    public function destroy(Order $order)
    {
        if ($order->trashed()) {
            $order->forceDelete();
        } else {
            $order->delete();
        }
        return response()->json(['message' => 'Order deleted successfully']);
    }

    /**
     * Restore a soft-deleted order.
     */
    public function restore($id)
    {
        $order = Order::withTrashed()->find($id);
        if (!$order || !$order->trashed()) {
            return response()->json(['message' => 'Order not found or not deleted'], 404);
        }

        $order->restore();

        return response()->json([
            'message' => 'Order restored successfully',
            'order'   => $order
        ]);
    }
}
