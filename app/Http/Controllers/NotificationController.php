<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        // Validate the request data with new fields
        $validated = $request->validate([
            'order_id' => 'nullable|integer|exists:orders,id',
            'title' => 'required|string|max:50',
            'description' => 'nullable|string',
            'is_admin_notification' => 'required|integer|in:0,1,2', // 0=user, 1=admin, 2=both
            'type' => 'nullable|string',
            'product_image' => 'nullable|string'
        ]);

        // Create the notification with all fields
        $notification = Notification::create([
            'user_id' => $user->id,
            'order_id' => $validated['order_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'is_admin_notification' => $validated['is_admin_notification'],
            'type' => $validated['type'] ?? null,
            'product_image' => $validated['product_image'] ?? null,
            'is_read' => 0,
        ]);

        return response()->json($notification, 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->with(['order', 'user']) // Load relationships if needed
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    public function markAsRead($id, Request $request)
    {
        $user = $request->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->update(['is_read' => 1]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        Notification::where('user_id', $user->id)
            ->where('is_read', 0)
            ->update(['is_read' => 1]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function getUnreadCount(Request $request)
    {
        $user = $request->user();
        
        $count = Notification::where('user_id', $user->id)
            ->where('is_read', 0)
            ->count();

        return response()->json(['count' => $count]);
    }

    // Admin-specific notification methods
    public function adminIndex(Request $request)
    {
        $notifications = Notification::where('is_admin_notification', '>', 0)
            ->with(['order', 'user'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($notifications);
    }

    public function getAdminUnreadCount(Request $request)
    {
        $count = Notification::where('is_admin_notification', '>', 0)
            ->where('is_read', 0)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markAdminAsRead($id)
    {
        $notification = Notification::where('id', $id)
            ->where('is_admin_notification', '>', 0)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->update(['is_read' => 1]);

        return response()->json(['message' => 'Admin notification marked as read']);
    }
}