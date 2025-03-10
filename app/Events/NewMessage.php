<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Chat;
use App\Models\User;

class NewMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $id;
    public $message;
    public $sender_id;
    public $receiver_id;
    public $created_at;
    public $sender;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct(Chat $chat)
    {
        $this->id = $chat->id;
        $this->message = $chat->message;
        $this->sender_id = $chat->sender_id;
        $this->receiver_id = $chat->receiver_id;
        $this->created_at = $chat->created_at;
        
        // If the sender relation is already loaded, use it to avoid extra query
        if ($chat->relationLoaded('sender')) {
            $this->sender = $chat->sender;
        } else {
            $this->sender = User::with('profile')->find($chat->sender_id);
        }
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        // Determine the appropriate channels based on user roles
        $channels = [];
        
        // Add channel for receiver - use appropriate format based on their role
        if (User::find($this->receiver_id)->role_id === 2) { // Assuming 2 is admin role
            $channels[] = new PrivateChannel('chat.admin.' . $this->receiver_id);
        } else {
            $channels[] = new PrivateChannel('chat.user.' . $this->receiver_id);
        }
        
        // Add channel for sender - use appropriate format based on their role
        if (User::find($this->sender_id)->role_id === 2) { // Assuming 2 is admin role
            $channels[] = new PrivateChannel('chat.admin.' . $this->sender_id);
        } else {
            $channels[] = new PrivateChannel('chat.user.' . $this->sender_id);
        }
        
        return $channels;
    }
}