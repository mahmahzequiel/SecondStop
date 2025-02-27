<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Events\NewMessage;

class ChatController extends Controller
{
    /**
     * Retrieve conversation messages between the authenticated user and another user.
     */
    public function getMessages(Request $request, $otherUserId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error("Unauthorized access in getMessages");
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->role_id == 2) {
            // For admin: messages between admin (receiver_id = admin's id) and the customer.
            $messages = Chat::where(function ($query) use ($otherUserId, $user) {
                    $query->where('sender_id', $otherUserId)
                          ->where('receiver_id', $user->id);
                })->orWhere(function ($query) use ($otherUserId, $user) {
                    $query->where('sender_id', $user->id)
                          ->where('receiver_id', $otherUserId);
                })
                ->orderBy('created_at', 'asc')
                ->get();
        } else {
            // For customer: one-on-one conversation.
            $messages = Chat::where(function ($query) use ($user, $otherUserId) {
                    $query->where('sender_id', $user->id)
                          ->where('receiver_id', $otherUserId);
                })->orWhere(function ($query) use ($user, $otherUserId) {
                    $query->where('sender_id', $otherUserId)
                          ->where('receiver_id', $user->id);
                })
                ->orderBy('created_at', 'asc')
                ->get();
        }

        Log::info("Fetched messages between user {$user->id} and {$otherUserId}", $messages->toArray());
        return response()->json(['messages' => $messages]);
    }

    /**
     * Send a message from the authenticated user.
     * - For a customer (role_id ≠ 2), duplicate the message for every admin.
     * - For an admin (role_id === 2), require a receiver_id (customer's id).
     */
    public function sendMessage(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error("Unauthorized access in sendMessage");
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validatedData = $request->validate([
            'message' => 'required|string',
        ]);

        if ($user->role_id !== 2) {
            // Customer: duplicate the message for all admins.
            $admins = User::withTrashed()->where('role_id', 2)->get();
            Log::debug("Admins count: " . $admins->count());
            if ($admins->isEmpty()) {
                Log::error("No admin found in database");
                return response()->json(['message' => 'No admin found'], 500);
            }

            $createdChats = [];
            foreach ($admins as $admin) {
                try {
                    $chat = Chat::create([
                        'sender_id'   => $user->id,
                        'receiver_id' => $admin->id,
                        'message'     => $validatedData['message'],
                        'date_time'   => now(),
                        'is_read'     => false,
                    ]);
                    $createdChats[] = $chat;
                    Log::info("Chat created for admin (ID: {$admin->id})", $chat->toArray());
                } catch (\Exception $e) {
                    Log::error("Error creating chat for admin (ID: {$admin->id}): " . $e->getMessage());
                }
            }
            // Return one of the created chats as a reference.
            return response()->json([
                'message' => 'Message sent successfully',
                'data'    => $createdChats[0],
            ], 201);
        } else {
            // Admin: require a receiver_id.
            $request->validate([
                'receiver_id' => 'required|exists:users,id',
            ]);
            $receiverId = $request->receiver_id;
            try {
                $chat = Chat::create([
                    'sender_id'   => $user->id,
                    'receiver_id' => $receiverId,
                    'message'     => $validatedData['message'],
                    'date_time'   => now(),
                    'is_read'     => false,
                ]);
                Log::info("Chat created by admin", $chat->toArray());
            } catch (\Exception $e) {
                Log::error("Error creating chat: " . $e->getMessage());
                return response()->json(['message' => 'Failed to send message'], 500);
            }
            return response()->json([
                'message' => 'Message sent successfully',
                'data'    => $chat,
            ], 201);
        }
    }

    /**
     * For admin: Retrieve all customer messages sent to them.
     * This version returns the raw messages (without grouping) for debugging.
     */
    public function getAllCustomerChats()
    {
        $user = Auth::user();
        if (!$user || $user->role_id != 2) {
            Log::warning("Unauthorized access to customer chats", ['user_id' => $user ? $user->id : null]);
            return response()->json(['message' => 'Forbidden'], 403);
        }

        Log::debug("getAllCustomerChats called by admin with ID: " . $user->id);

        // Retrieve all chats where receiver_id equals the admin's id (including soft-deleted records)
        $messages = Chat::withTrashed()->where('receiver_id', $user->id)
                        ->with('sender')
                        ->orderBy('created_at', 'desc')
                        ->get();

        Log::debug("Found " . $messages->count() . " messages for admin ID " . $user->id);
        Log::debug("Raw messages:", $messages->toArray());

        // For debugging, return raw messages.
        return response()->json(['customer_chats' => $messages]);
    }
}
