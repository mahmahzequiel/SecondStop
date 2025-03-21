<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Carbon\Carbon;
use App\Models\OrderItem;
use App\Models\CartItem;
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
                'payment_status' => 'required|in:Paid,Unpaid', // Added validation for new field
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
            
            // Add payment status info to notification
            $notificationDescription .= "Payment Status: {$order->payment_status}<br/>";
            
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
                'payment_id'     => 'required|exists:payments,id',
                'address_id'     => 'nullable|exists:addresses,id',
                'order_number'   => 'required|string|unique:orders,order_number,' . $order->id,
                'subtotal'       => 'required|numeric|min:0',
                'shipping_cost'  => 'required|numeric|min:0',
                'total_amount'   => 'required|numeric|min:0',
                'status'         => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
                'payment_status' => 'required|in:Paid,Unpaid', // Added validation for new field
                'purchase_date'  => 'nullable|date',
            ]);

            $oldStatus = $order->status;
            $newStatus = $validated['status'];
            
            $oldPaymentStatus = $order->payment_status;
            $newPaymentStatus = $validated['payment_status'];
            
            // Update the order
            $order->update($validated);
            
            // Create notification for status change
            $user = $request->user();
            if ($user) {
                $shouldNotify = false;
                $notificationTitle = "";
                $notificationDescription = "";
                
                // Check if order status changed
                if ($oldStatus !== $newStatus) {
                    $shouldNotify = true;
                    $notificationTitle = "Order Status Updated";
                    $notificationDescription = "Your order {$order->order_number} status has been changed to {$newStatus}.";
                    
                    // Customize notification based on new status
                    if ($newStatus === 'delivered') {
                        $notificationTitle = "Order Delivered Successfully";
                        $notificationDescription = "Your order {$order->order_number} has been marked as delivered. Thank you for shopping with us!";
                    } elseif ($newStatus === 'refunded') {
                        $notificationTitle = "Refund Requested";
                        $notificationDescription = "Your refund request for order {$order->order_number} has been submitted and is being processed.";
                    }
                }
                
                // Check if payment status changed
                if ($oldPaymentStatus !== $newPaymentStatus) {
                    $shouldNotify = true;
                    
                    // If we're already notifying about status change, add payment status info
                    if ($oldStatus !== $newStatus) {
                        $notificationDescription .= " Your payment status has been updated to {$newPaymentStatus}.";
                    } else {
                        // If only payment status changed
                        $notificationTitle = "Payment Status Updated";
                        $notificationDescription = "Your order {$order->order_number} payment status has been updated to {$newPaymentStatus}.";
                    }
                }
                
                // Send notification if something changed
                if ($shouldNotify) {
                    Notification::create([
                        'user_id'     => $user->id,
                        'order_id'    => $order->id,
                        'title'       => $notificationTitle,
                        'description' => $notificationDescription,
                        'is_read'     => 0,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Order updated successfully',
                'order'   => $order->load(['payment', 'address', 'orderItems.product']),
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
    
    /**
     * Cancel a specific order.
     */
    public function cancel(Request $request, Order $order)
    {
        try {
            // Only allow cancellation of pending orders
            if ($order->status !== 'pending') {
                return response()->json([
                    'error' => 'Only pending orders can be cancelled'
                ], 422);
            }
            
            $order->update(['status' => 'cancelled']);
            
            // If order was paid, we may want to handle refund logic here
            if ($order->payment_status === 'Paid') {
                // For now, just note this in the notification
                $refundNote = "Our team will process your refund shortly.";
            } else {
                $refundNote = "";
            }

            // Create a notification about the cancellation
            $user = $request->user();
            if ($user) {
                Notification::create([
                    'user_id'       => $user->id,
                    'order_id'      => $order->id,
                    'title'         => "Order Cancelled",
                    'description'   => "Your order {$order->order_number} has been cancelled. {$refundNote}",
                    'is_read'       => 0,
                ]);
            }

            return response()->json([
                'message' => 'Order cancelled successfully',
                'order'   => $order->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Mark order as delivered (order received by customer)
     */
    public function markAsDelivered(Request $request, Order $order)
    {
        try {
            // Only allow marking shipped orders as delivered
            if ($order->status !== 'shipped') {
                return response()->json([
                    'error' => 'Only shipped orders can be marked as delivered'
                ], 422);
            }
            
            $order->update(['status' => 'delivered']);

            // Create a notification
            $user = $request->user();
            if ($user) {
                Notification::create([
                    'user_id'       => $user->id,
                    'order_id'      => $order->id,
                    'title'         => "Order Delivered",
                    'description'   => "Your order {$order->order_number} has been marked as delivered. Thank you for shopping with us!",
                    'is_read'       => 0,
                ]);
            }

            return response()->json([
                'message' => 'Order marked as delivered successfully',
                'order'   => $order->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Update payment status for an order
     */
    public function updatePaymentStatus(Request $request, Order $order)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'payment_status' => 'required|in:Paid,Unpaid',
            ]);
            
            $oldPaymentStatus = $order->payment_status;
            $newPaymentStatus = $validated['payment_status'];
            
            // Skip if no change
            if ($oldPaymentStatus === $newPaymentStatus) {
                return response()->json([
                    'message' => 'No change in payment status',
                    'order'   => $order,
                ]);
            }
            
            // Update payment status
            $order->update(['payment_status' => $newPaymentStatus]);
            
            // Create a notification
            Notification::create([
                'user_id'     => $order->user_id,
                'order_id'    => $order->id,
                'title'       => "Payment Status Updated",
                'description' => "Your order {$order->order_number} payment status has been updated to {$newPaymentStatus}.",
                'is_read'     => 0,
            ]);
            
            return response()->json([
                'message' => 'Payment status updated successfully',
                'order'   => $order->refresh()->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function requestCancellation(Request $request, Order $order)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'request_notes' => 'required|string|max:500',
            ]);

            // Only allow cancellation requests for pending orders
            if ($order->status !== 'pending') {
                return response()->json([
                    'error' => 'Only pending orders can be requested for cancellation'
                ], 422);
            }
            
            $order->update([
                'status' => 'cancellation_requested',
                'request_notes' => $validated['request_notes'],
                'request_date' => Carbon::now()
            ]);

            // Create a notification
            $user = $request->user();
            if ($user) {
                Notification::create([
                    'user_id'     => $user->id,
                    'order_id'    => $order->id,
                    'title'       => "Cancellation Requested",
                    'description' => "Your cancellation request for order {$order->order_number} has been submitted and is pending admin approval.",
                    'is_read'     => 0,
                ]);
            }

            return response()->json([
                'message' => 'Cancellation requested successfully',
                'order'   => $order->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Request a refund for an order
     */
    public function requestRefund(Request $request, Order $order)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'request_notes' => 'required|string|max:500',
            ]);

            // Only allow refunds for shipped or delivered orders that have been paid
            if (!in_array($order->status, ['shipped', 'delivered'])) {
                return response()->json([
                    'error' => 'Only shipped or delivered orders can be requested for refund'
                ], 422);
            }
            
            if ($order->payment_status !== 'Paid') {
                return response()->json([
                    'error' => 'Only paid orders can be requested for refund'
                ], 422);
            }
            
            $order->update([
                'status' => 'refund_requested',
                'request_notes' => $validated['request_notes'],
                'request_date' => Carbon::now()
            ]);

            // Create a notification
            $user = $request->user();
            if ($user) {
                Notification::create([
                    'user_id'     => $user->id,
                    'order_id'    => $order->id,
                    'title'       => "Refund Requested",
                    'description' => "Your refund request for order {$order->order_number} has been submitted and is pending admin approval.",
                    'is_read'     => 0,
                ]);
            }

            return response()->json([
                'message' => 'Refund requested successfully',
                'order'   => $order->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Admin approval for cancellation
     */
    public function approveCancellation(Request $request, Order $order)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'admin_notes' => 'nullable|string|max:500',
            ]);

            // Check if the order is in cancellation_requested status
            if ($order->status !== 'cancellation_requested') {
                return response()->json([
                    'error' => 'This order does not have a pending cancellation request'
                ], 422);
            }
            
            // Update order
            $order->update([
                'status' => 'cancellation_approved',
                'admin_notes' => $validated['admin_notes'] ?? null,
                'admin_action_date' => Carbon::now()
            ]);
            
            // Then finalize to cancelled status
            $order->update(['status' => 'cancelled']);
            
            // If order was paid, update to indicate a refund is needed
            $refundNote = "";
            if ($order->payment_status === 'Paid') {
                $refundNote = " A refund will be processed for your payment.";
            }

            // Notify user
            Notification::create([
                'user_id'     => $order->user_id,
                'order_id'    => $order->id,
                'title'       => "Cancellation Approved",
                'description' => "Your cancellation request for order {$order->order_number} has been approved.{$refundNote} " . 
                                 ($validated['admin_notes'] ? "Admin note: {$validated['admin_notes']}" : ""),
                'is_read'     => 0,
            ]);

            return response()->json([
                'message' => 'Order cancellation approved successfully',
                'order'   => $order->refresh()->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Admin denial for cancellation
     */
    public function denyCancellation(Request $request, Order $order)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'admin_notes' => 'required|string|max:500',
            ]);

            // Check if the order is in cancellation_requested status
            if ($order->status !== 'cancellation_requested') {
                return response()->json([
                    'error' => 'This order does not have a pending cancellation request'
                ], 422);
            }
            
            // Update order
            $order->update([
                'status' => 'cancellation_denied',
                'admin_notes' => $validated['admin_notes'],
                'admin_action_date' => Carbon::now()
            ]);
            
            // Then restore to previous status (pending)
            $order->update(['status' => 'pending']);

            // Notify user
            Notification::create([
                'user_id'     => $order->user_id,
                'order_id'    => $order->id,
                'title'       => "Cancellation Denied",
                'description' => "Your cancellation request for order {$order->order_number} has been denied. Admin note: {$validated['admin_notes']}",
                'is_read'     => 0,
            ]);

            return response()->json([
                'message' => 'Order cancellation denied',
                'order'   => $order->refresh()->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Admin approval for refund
     */
    public function approveRefund(Request $request, Order $order)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'admin_notes' => 'nullable|string|max:500',
            ]);

            // Check if the order is in refund_requested status
            if ($order->status !== 'refund_requested') {
                return response()->json([
                    'error' => 'This order does not have a pending refund request'
                ], 422);
            }
            
            // Update order
            $order->update([
                'status' => 'refund_approved',
                'admin_notes' => $validated['admin_notes'] ?? null,
                'admin_action_date' => Carbon::now()
            ]);
            
            // Then finalize to refunded status
            $order->update(['status' => 'refunded']);

            // Notify user
            Notification::create([
                'user_id'     => $order->user_id,
                'order_id'    => $order->id,
                'title'       => "Refund Approved",
                'description' => "Your refund request for order {$order->order_number} has been approved. " . 
                                 ($validated['admin_notes'] ? "Admin note: {$validated['admin_notes']}" : ""),
                'is_read'     => 0,
            ]);

            return response()->json([
                'message' => 'Order refund approved successfully',
                'order'   => $order->refresh()->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Admin denial for refund
     */
    public function denyRefund(Request $request, Order $order)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'admin_notes' => 'required|string|max:500',
            ]);

            // Check if the order is in refund_requested status
            if ($order->status !== 'refund_requested') {
                return response()->json([
                    'error' => 'This order does not have a pending refund request'
                ], 422);
            }
            
            // Update order
            $order->update([
                'status' => 'refund_denied',
                'admin_notes' => $validated['admin_notes'],
                'admin_action_date' => Carbon::now()
            ]);
            
            // Then restore to previous status (shipped or delivered)
            $previousStatus = $order->created_at->diffInDays(now()) > 5 ? 'delivered' : 'shipped';
            $order->update(['status' => $previousStatus]);

            // Notify user
            Notification::create([
                'user_id'     => $order->user_id,
                'order_id'    => $order->id,
                'title'       => "Refund Denied",
                'description' => "Your refund request for order {$order->order_number} has been denied. Admin note: {$validated['admin_notes']}",
                'is_read'     => 0,
            ]);

            return response()->json([
                'message' => 'Order refund denied',
                'order'   => $order->refresh()->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateStatus(Request $request, Order $order)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,shipped,delivered,cancelled,returned,refunded',
            ]);
            
            $oldStatus = $order->status;
            $newStatus = $validated['status'];
            
            // Update just the status
            $order->update(['status' => $newStatus]);
            
            // Create notification for status change
            if ($oldStatus !== $newStatus) {
                $notificationTitle = "Order Status Updated";
                $notificationDescription = "Your order {$order->order_number} status has been changed to {$newStatus}.";
                
                // Customize notification based on new status
                if ($newStatus === 'delivered') {
                    $notificationTitle = "Order Delivered Successfully";
                    $notificationDescription = "Your order {$order->order_number} has been marked as delivered. Thank you for shopping with us!";
                } elseif ($newStatus === 'refunded') {
                    $notificationTitle = "Order Refunded";
                    $notificationDescription = "Your order {$order->order_number} has been refunded.";
                    
                    // Also update payment status if refunded
                    if ($order->payment_status === 'Paid') {
                        $order->update(['payment_status' => 'Unpaid']);
                        $notificationDescription .= " Your payment has been returned.";
                    }
                }
                
                Notification::create([
                    'user_id'     => $order->user_id,
                    'order_id'    => $order->id,
                    'title'       => $notificationTitle,
                    'description' => $notificationDescription,
                    'is_read'     => 0,
                ]);
            }

            return response()->json([
                'message' => 'Order status updated successfully',
                'order'   => $order->load(['payment', 'address', 'orderItems.product']),
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }
}