<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Display a listing of all orders.
     */
    public function index()
    {
        $orders = Order::with(['cart', 'payment', 'address'])->get(); // Eager load relationships
        return response()->json(['orders' => $orders]);
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'cart_id' => 'required|exists:carts,id',
            'payment_id' => 'required|exists:payments,id',
            'address_id' => 'nullable|exists:addresses,id',
            'order_number' => 'nullable|string|unique:orders,order_number',
            'subtotal' => 'required|numeric|min:0',
            'shipping_cost' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
            'purchase_date' => 'nullable|date',
        ]);

        if (!$request->order_number) {
            $validated['order_number'] = 'ORD-' . mt_rand(100000, 999999);
        }

        $order = Order::create($validated);

        return response()->json([
            'message' => 'Order created successfully',
            'order' => $order
        ], 201);
    } catch (ValidationException $e) {
        \Log::error('Validation Error:', $e->errors());  // 🔴 Logs validation errors
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
                'cart_id' => 'required|exists:carts,id',
                'payment_id' => 'required|exists:payments,id',
                'address_id' => 'nullable|exists:addresses,id',
                'order_number' => 'required|string|unique:orders,order_number,' . $order->id,
                'subtotal' => 'required|numeric|min:0',
                'shipping_cost' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'status' => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
                'purchase_date' => 'nullable|date',
            ]);

            $order->update($validated);

            return response()->json([
                'message' => 'Order updated successfully',
                'order' => $order
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    /**
     * Remove (soft delete) the specified order.
     */
    public function destroy(Order $order)
    {
        if ($order->trashed()) {
            $order->forceDelete(); // Permanently delete if already soft deleted
        } else {
            $order->delete(); // Soft delete
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

        return response()->json(['message' => 'Order restored successfully', 'order' => $order]);
    }
}
