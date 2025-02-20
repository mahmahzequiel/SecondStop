<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        if ($user->is_admin) {
            // Admin can see all customers who messaged
            $customers = Chat::select('sender_id')->distinct()->with('sender')->get();
            return response()->json($customers);
        } else {
            // Customers only see their conversation
            $messages = Chat::where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id)
                ->with(['sender', 'receiver'])
                ->get();
            return response()->json($messages);
        }
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string',
        ]);

        $chat = Chat::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'message' => $request->message,
        ]);

        return response()->json($chat, 201);
    }
}
