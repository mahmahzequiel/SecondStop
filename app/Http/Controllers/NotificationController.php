<?php

namespace App\Http\Controllers;

use App\Models\Notification; // Import the singular Notification model
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user(); // The authenticated user

        // Validate the request data
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'title' => 'required|string',
            'description' => 'nullable|string',
        ]);

        // Create the notification
        $notification = Notification::create([
            'user_id' => $user->id,
            'order_id' => $validated['order_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'is_read' => 0,
        ]);

        return response()->json($notification, 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $notifications = Notification::where('user_id', $user->id)
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
            return response()->json(['message' => 'Not found'], 404);
        }

        $notification->is_read = 1;
        $notification->save();

        return response()->json(['message' => 'Notification marked as read']);
    }
}
