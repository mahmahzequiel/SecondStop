<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|in:order,message,system',
            'order_id' => 'nullable|integer|exists:orders,id',
            'product_image' => 'nullable|string',
            'is_admin' => 'nullable|boolean'
        ]);

        // If this is an order notification, get order details
        $orderDetails = '';
        if (isset($validated['order_id']) && $validated['type'] === 'order') {
            $order = Order::find($validated['order_id']);
            if ($order) {
                $orderDetails = "ORD-{$order->id} has been placed. 
                    Payment Status: " . ($order->payment_status ?? 'Unknown') . "
                    " . ($order->product_name ?? 'Product') . " (x" . ($order->quantity ?? '1') . ") - PHP " . ($order->price ?? '0.00') . "
                    Total Amount: PHP " . ($order->total_amount ?? '0.00');
            }
        }

        // Create admin notifications
        if ($validated['type'] === 'order') {
            // Find all admin users
            $adminUsers = User::where('is_admin', true)
                              ->orWhere('id', 2)  // Make sure user_id 2 (admin) gets notification
                              ->get();
            
            $notifications = [];
            
            foreach ($adminUsers as $admin) {
                $notifications[] = Notification::create([
                    'user_id' => $admin->id,
                    'order_id' => $validated['order_id'] ?? null,
                    'title' => 'New Order',  // Change title for admins
                    'description' => "An order has been placed. " . $orderDetails,  // Different format for admins
                    'type' => 'order',
                    'product_image' => $validated['product_image'] ?? null,
                    'is_read' => 0,
                    'is_admin_notification' => 1
                ]);
            }
        }

        // Create customer notification
        if (Auth::id() && !Auth::user()->is_admin) {
            $notification = Notification::create([
                'user_id' => Auth::id(),
                'order_id' => $validated['order_id'] ?? null,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? '',
                'type' => $validated['type'] ?? 'system',
                'product_image' => $validated['product_image'] ?? null,
                'is_read' => 0,
                'is_admin_notification' => 0
            ]);
            
            return response()->json($notification, 201);
        }
        
        return response()->json(['message' => 'Notifications created successfully'], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get notifications for the current user
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $notification->update(['is_read' => 1]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->where('is_read', 0)
            ->update(['is_read' => 1]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function unreadCount()
    {
        $count = Notification::where('user_id', Auth::id())
            ->where('is_read', 0)
            ->count();

        return response()->json(['count' => $count]);
    }
}