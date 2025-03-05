<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Display a listing of all orders.
     */
    // OrderController.php

public function index()
{
    // Log the query being executed
    \DB::enableQueryLog();
    $orders = Order::with(['carts.product', 'payment', 'address'])->get();
    \Log::info(\DB::getQueryLog());

    // Log the data being returned
    \Log::info($orders);

    $orders = $orders->map(function ($order) {
        return [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'subtotal' => $order->subtotal,
            'shipping_cost' => $order->shipping_cost,
            'total_amount' => $order->total_amount,
            'status' => $order->status,
            'purchase_date' => $order->purchase_date,
            'items' => $order->carts->map(function ($cart) {
                \Log::info($cart); // Log the cart data
                \Log::info($cart->product); // Log the product data
                return [
                    'product_name' => $cart->product->product_name ?? 'Unknown',
                    'price' => $cart->product->price ?? 0,
                ];
            }),
        ];
    });

    return response()->json(['orders' => $orders]);
}

    /**
     * Store a newly created order.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'cart_id' => 'required', // Can be an array or a single value
                'payment_id' => 'required|exists:payments,id',
                'address_id' => 'nullable|exists:addresses,id',
                'subtotal' => 'required|numeric|min:0',
                'shipping_cost' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'status' => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
                'purchase_date' => 'nullable|date',
            ]);

            // Ensure cart_id is an array
            $cartIds = is_array($request->cart_id) ? $request->cart_id : [$request->cart_id];

            // Validate that each cart ID exists
            foreach ($cartIds as $cartId) {
                if (!Cart::where('id', $cartId)->exists()) {
                    return response()->json(['error' => "Invalid cart_id: $cartId"], 400);
                }
            }

            // Generate unique order number if not provided
            $validated['order_number'] = 'ORD-' . mt_rand(100000, 999999);

            // Set purchase date
            $validated['purchase_date'] = !empty($request->purchase_date) 
                ? Carbon::parse($request->purchase_date)->format('Y-m-d H:i:s') 
                : now()->format('Y-m-d H:i:s');

            // Create the order (removed user_id)
            $order = Order::create([
                'payment_id' => $validated['payment_id'],
                'address_id' => $validated['address_id'],
                'order_number' => $validated['order_number'],
                'subtotal' => $validated['subtotal'],
                'shipping_cost' => $validated['shipping_cost'],
                'total_amount' => $validated['total_amount'],
                'status' => $validated['status'],
                'purchase_date' => $validated['purchase_date'],
            ]);

            // Attach carts to the order using the pivot table
            $order->carts()->attach($cartIds);

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->load('carts') // Load carts for response
            ], 201);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display a specific order.
     */
    public function show(Order $order)
    {
        $order->load(['carts.product', 'payment', 'address']);
    
        $orderData = [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'subtotal' => $order->subtotal,
            'shipping_cost' => $order->shipping_cost,
            'total_amount' => $order->total_amount,
            'status' => $order->status,
            'purchase_date' => $order->purchase_date,
            'items' => $order->carts->map(function ($cart) {
                return [
                    'product_name' => $cart->product->product_name ?? 'Unknown',
                    'price' => $cart->product->price ?? 0,
                ];
            }),
        ];
    
        return response()->json(['order' => $orderData]);
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

    /**
     * Fetch orders by status.
     */
    public function getOrdersByStatus($status)
    {
        $orders = Order::with(['payment', 'address', 'carts.product'])
            ->where('status', $status)
            ->get()
            ->map(function ($order) {
                return [
                    'order_id'      => $order->id,
                    'order_number'  => $order->order_number,
                    'purchase_date' => $order->purchase_date,
                    'total_amount'  => $order->total_amount,
                    'status'        => $order->status,
                    'items'         => $order->carts->map(fn($cart) => [
                        'product_name' => $cart->product->product_name ?? 'Unknown',
                        'price'        => $cart->product->price ?? 0,
                    ]),
                ];
            });

        return response()->json(['orders' => $orders]);
    }

    /**
     * Fetch all orders for the authenticated user's carts.
     */
    public function getUserOrders(Request $request)
    {
        $userId = auth()->id();
    
        $orders = Order::whereHas('cart', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->with(['carts.product'])  // Load product details
            ->get();
    
        return response()->json(['orders' => $orders]);
    }
    



    
}
