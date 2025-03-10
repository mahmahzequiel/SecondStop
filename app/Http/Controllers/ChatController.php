<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Chat;
use App\Models\User;
use App\Events\NewMessage;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * Get messages for a conversation with a specific user.
     */
    public function getMessages($userId)
    {
        $currentUserId = Auth::id();
        
        // Get messages in the conversation
        $messages = Chat::with(['sender.profile'])
            ->where(function($query) use ($currentUserId, $userId) {
                $query->where('sender_id', $currentUserId)
                      ->where('receiver_id', $userId);
            })
            ->orWhere(function($query) use ($currentUserId, $userId) {
                $query->where('sender_id', $userId)
                      ->where('receiver_id', $currentUserId);
            })
            ->orderBy('created_at')
            ->get();
            
        // Mark messages as read
        Chat::where('sender_id', $userId)
            ->where('receiver_id', $currentUserId)
            ->where('is_read', 0)
            ->update(['is_read' => 1]);
              
        return response()->json(['messages' => $messages]);
    }
    
    /**
     * Send a new message.
     */
    public function sendMessage(Request $request)
    {
        try {
            $user = Auth::user();
            $validated = $request->validate([
                'message' => 'required|string',
                'receiver_id' => 'sometimes|exists:users,id',
            ]);
            
            // Determine receiver_id based on user role
            $receiver_id = isset($validated['receiver_id']) 
                ? $validated['receiver_id'] 
                : $this->getDefaultReceiverId(); // Method to get default admin
                
            // Create and save the chat message
            $chat = new Chat([
                'sender_id' => $user->id,
                'receiver_id' => $receiver_id,
                'message' => $validated['message'],
                'date_time' => now(),
                'is_read' => 0,
            ]);
            $chat->save();
            
            // Load the sender relation for the event
            $chat->load('sender.profile');
            
            // Broadcast the new message event
            broadcast(new NewMessage($chat))->toOthers();
            
            return response()->json([
                'success' => true,
                'data' => $chat
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTrace()
            ], 500);
        }
    }
    
    /**
     * Mark messages as read.
     */
    public function markAsRead(Request $request)
    {
        $request->validate([
            'sender_id' => 'required|exists:users,id',
        ]);
        
        $currentUserId = Auth::id();
        $senderId = $request->sender_id;
        
        Chat::where('sender_id', $senderId)
            ->where('receiver_id', $currentUserId)
            ->where('is_read', 0)
            ->update(['is_read' => 1]);
              
        return response()->json(['success' => true]);
    }
    
    /**
     * Get a default admin to receive messages from regular users.
     */
    private function getDefaultReceiverId()
    {
        // For simple implementation, just get the first admin (role_id = 2)
        $admin = User::where('role_id', 2)->first();
        
        if (!$admin) {
            throw new \Exception('No admin found to receive messages');
        }
        
        return $admin->id;
    }
    
    /**
     * Get unread message count for current user.
     */
    public function getUnreadCount()
    {
        $currentUserId = Auth::id();
        
        $count = Chat::where('receiver_id', $currentUserId)
                     ->where('is_read', 0)
                     ->count();
                        
        return response()->json(['unread_count' => $count]);
    }
}