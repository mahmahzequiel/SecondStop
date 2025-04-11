<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\User;
use App\Models\Profile;
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
                ->with(['sender.profile', 'receiver.profile'])
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
                ->with(['sender.profile', 'receiver.profile'])
                ->orderBy('created_at', 'asc')
                ->get();
        }
        
        // Remove this orphaned broadcast - no $chat variable exists here
        // broadcast(new NewMessage($chat))->toOthers();

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
                    
                    // Load relationships before broadcasting
                    $chat->load(['sender.profile', 'receiver.profile']);
                    
                    // Place the broadcast call after creating the chat
                    broadcast(new NewMessage($chat))->toOthers();
                    
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

                // Load relationships before broadcasting
                $chat->load(['sender.profile', 'receiver.profile']);
                
                // Add the broadcast call here
                broadcast(new NewMessage($chat))->toOthers();
                
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
                        ->with(['sender', 'sender.profile'])
                        ->orderBy('created_at', 'desc')
                        ->get();

        Log::debug("Found " . $messages->count() . " messages for admin ID " . $user->id);
        Log::debug("Raw messages:", $messages->toArray());

        // For debugging, return raw messages.
        return response()->json(['customer_chats' => $messages]);
    }

    /**
     * For admin: Get all conversations grouped by customer with latest message and unread count
     */
    public function getConversations()
    {
        $user = Auth::user();
        if (!$user || $user->role_id != 2) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Get unique customer IDs who have sent messages to this admin
        $customerIds = Chat::where('receiver_id', $user->id)
            ->select('sender_id')
            ->distinct()
            ->pluck('sender_id');

        $conversations = [];
        foreach ($customerIds as $customerId) {
            // Get customer details with profile
            $customer = User::with('profile')->find($customerId);
            if (!$customer) continue;
            
            // Get the latest message
            $latestMessage = Chat::where(function ($query) use ($customerId, $user) {
                    $query->where('sender_id', $customerId)
                          ->where('receiver_id', $user->id);
                })->orWhere(function ($query) use ($customerId, $user) {
                    $query->where('sender_id', $user->id)
                          ->where('receiver_id', $customerId);
                })
                ->orderBy('created_at', 'desc')
                ->first();
                
            // Count unread messages
            $unreadCount = Chat::where('sender_id', $customerId)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();
                
            if ($latestMessage) {
                $conversations[] = [
                    'user_id' => $customerId,
                    'user_name' => $customer->username,
                    'profile_image' => $customer->profile ? $customer->profile->profile_image : null,
                    'first_name' => $customer->profile ? $customer->profile->first_name : null,
                    'last_name' => $customer->profile ? $customer->profile->last_name : null,
                    'last_message' => $latestMessage->message,
                    'last_message_time' => $latestMessage->created_at,
                    'unread_count' => $unreadCount
                ];
            }
        }
        
        // Sort by latest message
        usort($conversations, function($a, $b) {
            return strtotime($b['last_message_time']) - strtotime($a['last_message_time']);
        });

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Mark messages as read for a specific conversation
     */
    public function markAsRead(Request $request, $senderId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        // Mark all messages from this sender to this user as read
        Chat::where('sender_id', $senderId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);
            
        return response()->json(['message' => 'Messages marked as read']);
    }

    /**
     * Get messages between admin and user with user details
     */
    public function getMessagesWithUserData(Request $request, $otherUserId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Get user details with profile
        $otherUser = User::with('profile')->find($otherUserId);
        if (!$otherUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $messages = Chat::where(function ($query) use ($otherUserId, $user) {
                $query->where('sender_id', $otherUserId)
                      ->where('receiver_id', $user->id);
            })->orWhere(function ($query) use ($otherUserId, $user) {
                $query->where('sender_id', $user->id)
                      ->where('receiver_id', $otherUserId);
            })
            ->with(['sender.profile', 'receiver.profile'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'messages' => $messages,
            'user_name' => $otherUser->username,
            'profile' => $otherUser->profile ? [
                'first_name' => $otherUser->profile->first_name,
                'middle_name' => $otherUser->profile->middle_name,
                'last_name' => $otherUser->profile->last_name,
                'profile_image' => $otherUser->profile->profile_image
            ] : null
        ]);
    }

    /**
     * For customers: Retrieve all messages sent to and from this customer
     */
    public function getCustomerMessages()
    {
        $user = Auth::user();
        if (!$user) {
            Log::error("Unauthorized access in getCustomerMessages");
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Only allow customers to access this endpoint
        if ($user->role_id == 2) {
            Log::warning("Admin attempting to access customer messages endpoint", ['admin_id' => $user->id]);
            return response()->json(['message' => 'Forbidden - This endpoint is for customers only'], 403);
        }

        Log::debug("getCustomerMessages called by customer with ID: " . $user->id);

        // Get all messages where the customer is either sender or receiver
        $messages = Chat::where('sender_id', $user->id)
                        ->orWhere('receiver_id', $user->id)
                        ->with(['sender.profile', 'receiver.profile'])
                        ->orderBy('created_at', 'asc')
                        ->get();

        // Find a valid admin to respond to (prefer the last admin they communicated with)
        $lastAdminConversation = Chat::where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->whereHas('receiver', function($q) {
                          $q->where('role_id', 2);
                      });
            })
            ->orWhere(function($query) use ($user) {
                $query->where('receiver_id', $user->id)
                      ->whereHas('sender', function($q) {
                          $q->where('role_id', 2);
                      });
            })
            ->orderBy('created_at', 'desc')
            ->first();

        $admin_id = null;
        $admin_profile = null;
        
        if ($lastAdminConversation) {
            if ($lastAdminConversation->sender_id != $user->id) {
                // Check if sender is an admin
                $senderUser = User::with('profile')->find($lastAdminConversation->sender_id);
                if ($senderUser && $senderUser->role_id == 2) {
                    $admin_id = $lastAdminConversation->sender_id;
                    $admin_profile = $senderUser->profile;
                }
            } elseif ($lastAdminConversation->receiver_id != $user->id) {
                // Check if receiver is an admin
                $receiverUser = User::with('profile')->find($lastAdminConversation->receiver_id);
                if ($receiverUser && $receiverUser->role_id == 2) {
                    $admin_id = $lastAdminConversation->receiver_id;
                    $admin_profile = $receiverUser->profile;
                }
            }
        }

        // If no admin found from messages, just get the first admin in the system
        if (!$admin_id) {
            $firstAdmin = User::with('profile')->where('role_id', 2)->first();
            if ($firstAdmin) {
                $admin_id = $firstAdmin->id;
                $admin_profile = $firstAdmin->profile;
            }
        }

        Log::info("Customer messages retrieved for user {$user->id}, total messages: " . $messages->count());
        
        return response()->json([
            'messages' => $messages,
            'admin_id' => $admin_id,
            'admin_profile' => $admin_profile ? [
                'first_name' => $admin_profile->first_name,
                'last_name' => $admin_profile->last_name,
                'profile_image' => $admin_profile->profile_image
            ] : null
        ]);
    }

    /**
     * Get user profile info by user ID
     */
    public function getUserProfile($userId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $profileUser = User::with('profile')->find($userId);
        if (!$profileUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'profile' => $profileUser->profile ? [
                'first_name' => $profileUser->profile->first_name,
                'middle_name' => $profileUser->profile->middle_name,
                'last_name' => $profileUser->profile->last_name,
                'profile_image' => $profileUser->profile->profile_image
            ] : null
        ]);
    }
}