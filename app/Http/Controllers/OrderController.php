<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use App\Models\Notification;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Display a listing of all orders.
     */
    public function index()
    {
        $orders = Order::with(['orderItems.product', 'payment', 'address'])->get();
        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    /**
     * Process checkout and create order
     */
    public function checkout(Request $request)
    {
        DB::beginTransaction();
        
        try {
            $user = $request->user();

            // Get cart item ID from request with correct parameter name
            $cartItemId = $request->input('cart_item_id'); // Fixed parameter name

            // Get cart item with ownership check
            $cartItem = CartItem::with('product')
                ->whereHas('cart', function($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->find($cartItemId);

            if (!$cartItem) {
                Log::error("Cart item not found", [
                    'cart_item_id' => $cartItemId,
                    'user_id' => $user->id
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cart item not found or unauthorized'
                ], 404);
            }

            // Validate request
            $validated = $request->validate([
                'payment_method' => 'required|in:cod,gcash,paypal',
                'address_id' => 'nullable|exists:addresses,id',
                'shipping_cost' => 'required|numeric|min:0|max:1000'
            ]);

            // Calculate totals
            $subtotal = $cartItem->product->price;
            $totalAmount = $subtotal + $validated['shipping_cost'];

            // Create payment
            $payment = Payment::create([
                'payment_method' => strtolower($validated['payment_method']),
                'amount' => $totalAmount,
                'status' => 'pending'
            ]);

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'payment_id' => $payment->id,
                'address_id' => $validated['address_id'],
                'order_number' => 'ORD-' . mt_rand(100000, 999999),
                'subtotal' => $subtotal,
                'shipping_cost' => $validated['shipping_cost'],
                'total_amount' => $totalAmount,
                'status' => 'pending'
            ]);

            // Create order item
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $cartItem->product_id,
                'quantity' => 1,
                'price' => $cartItem->product->price
            ]);

            // Clear the cart item
            $cartItem->delete();

            // Create notification
            Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'title' => 'Order Placed',
                'description' => 'Your order #'.$order->order_number.' has been placed successfully'
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => $order->load('orderItems.product', 'payment')
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Checkout Error: ' . $e->getMessage());
            Log::error('Stack Trace: ' . $e->getTraceAsString());
            return response()->json([
                'status' => 'error',
                'message' => 'Checkout failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Display a specific order.
     */
    public function show(Order $order)
    {
        return response()->json([
            'status' => 'success',
            'data' => $order->load(['orderItems.product', 'payment', 'address'])
        ]);
    }

    /**
     * Update an existing order.
     */
    public function update(Request $request, Order $order)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
                'shipping_cost' => 'sometimes|numeric|min:0',
                'address_id' => 'sometimes|exists:addresses,id'
            ]);

            $order->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Order updated successfully',
                'data' => $order
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Soft-delete or force-delete the specified order.
     */
    public function destroy(Order $order)
    {
        try {
            if ($order->trashed()) {
                $order->forceDelete();
            } else {
                $order->delete();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Order deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Order Delete Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete order'
            ], 500);
        }
    }

    /**
     * Restore a soft-deleted order.
     */
    public function restore($id)
    {
        try {
            $order = Order::withTrashed()->findOrFail($id);
            
            if ($order->trashed()) {
                $order->restore();
                return response()->json([
                    'status' => 'success',
                    'message' => 'Order restored successfully',
                    'data' => $order
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Order is not deleted'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Order Restore Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found'
            ], 404);
        }
    }
}