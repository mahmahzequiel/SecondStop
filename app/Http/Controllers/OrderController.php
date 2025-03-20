<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CartItem;          // Ensure this import is present
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
        // Load orders with payment, address, and order items (including product details).
        $orders = Order::with(['payment', 'address', 'orderItems.product'])->get();
        return response()->json(['orders' => $orders]);
    }

    /**
     * Store a newly created order, converting selected cart items to order items,
     * removing those purchased cart items, and creating a detailed notification.
     */
    public function store(Request $request)
    {
        try {
            // Validate incoming data.
            // We now require 'cart_item_ids' instead of 'cart_ids'.
            $validated = $request->validate([
                'payment_id'     => 'required|exists:payments,id',
                'address_id'     => 'nullable|exists:addresses,id',
                'order_number'   => 'nullable|string|unique:orders,order_number',
                'subtotal'       => 'required|numeric|min:0',
                'shipping_cost'  => 'required|numeric|min:0',
                'total_amount'   => 'required|numeric|min:0',
                'status'         => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
                'purchase_date'  => 'nullable|date',
                'cart_item_ids'  => 'required|array',
                'cart_item_ids.*'=> 'integer|exists:cart_items,id',
            ]);

            // Retrieve the authenticated user.
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }
            $validated['user_id'] = $user->id;

            // Generate an order number if not provided.
            if (empty($validated['order_number'])) {
                $validated['order_number'] = 'ORD-' . mt_rand(100000, 999999);
            }

            // Create the order record.
            $order = Order::create($validated);

            // Prepare a collection to track order items for notification details.
            $allOrderItems = collect();

            // Loop over each selected cart item ID.
            $cartItemIds = $validated['cart_item_ids'];
            foreach ($cartItemIds as $cartItemId) {
                // Load each CartItem with its related Product.
                $cartItem = CartItem::with('product')->find($cartItemId);
                if ($cartItem) {
                    // Create an OrderItem from the CartItem.
                    $orderItem = OrderItem::create([
                        'order_id'   => $order->id,
                        'product_id' => $cartItem->product_id,
                        'quantity'   => $cartItem->quantity,
                    ]);

                    // Manually attach the product relation so that $orderItem->product works.
                    $orderItem->setRelation('product', $cartItem->product);

                    // Add this OrderItem to the collection.
                    $allOrderItems->push($orderItem);

                    // Remove just this single CartItem from the cart.
                    $cartItem->delete();
                }
            }

            // Build a detailed notification.
            $notificationTitle = "Order Placed Successfully";
            $notificationDescription = "Your order {$order->order_number} has been placed.<br/>";
            $firstProductImage = null;

            if ($allOrderItems->count() > 0) {
                $firstItem = $allOrderItems->first();
                if ($firstItem && $firstItem->product) {
                    // Optionally, use the first product's name as a highlight.
                    $notificationTitle = $firstItem->product->product_name;
                    if ($firstItem->product->product_image) {
                        $firstProductImage = $firstItem->product->product_image;
                    }
                }
                foreach ($allOrderItems as $item) {
                    $product = $item->product;
                    $productName = $product ? $product->product_name : 'Unknown Product';
                    $quantity = $item->quantity;
                    $price = $product ? $product->price : 0;
                    $notificationDescription .= "{$productName} (x{$quantity}) - PHP " . number_format($price, 2) . "<br/>";
                }
            }
            $notificationDescription .= "Total Amount: PHP " . number_format($order->total_amount, 2);

            // Create the notification.
            Notification::create([
                'user_id'       => $user->id,
                'order_id'      => $order->id,
                'title'         => $notificationTitle,
                'description'   => $notificationDescription,
                'is_read'       => 0,
                'product_image' => $firstProductImage,
            ]);

            return response()->json([
                'message' => 'Order created successfully',
                'order'   => $order,
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
        return response()->json(['order' => $order->load(['payment', 'address', 'orderItems.product'])]);
    }

    /**
     * Update an existing order.
     */
    public function update(Request $request, Order $order)
    {
        try {
            $validated = $request->validate([
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
                'order'   => $order,
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
            'order'   => $order,
        ]);
    }
}
