<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
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
            'is_admin' => 'nullable|boolean' // Flag to send to all admins
        ]);

        if ($request->is_admin) {
            // Send to all admin users
            $adminUsers = User::where('is_admin', true)->get();
            $notifications = [];
            
            foreach ($adminUsers as $admin) {
                $notifications[] = Notification::create([
                    'user_id' => $admin->id,
                    'order_id' => $validated['order_id'] ?? null,
                    'title' => $validated['title'],
                    'description' => $validated['description'] ?? '',
                    'type' => $validated['type'] ?? 'order',
                    'is_read' => 0
                ]);
            }
            
            return response()->json($notifications, 201);
        }

        // For regular user notifications
        $notification = Notification::create([
            'user_id' => Auth::id(),
            'order_id' => $validated['order_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'type' => $validated['type'] ?? 'order',
            'is_read' => 0
        ]);

        return response()->json($notification, 201);
    }

    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
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