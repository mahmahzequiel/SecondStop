<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = ['username', 'email', 'password', 'role_id'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['email_verified_at' => 'datetime'];

    // Relationships:
    
    // Each User belongs to one Role.
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    // Each User has one Profile.
    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    // Each User has one Cart.
    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    // Chats: A user can send many chats.
    public function sentChats()
    {
        return $this->hasMany(Chat::class, 'sender_id');
    }

    // And receive many chats.
    public function receivedChats()
    {
        return $this->hasMany(Chat::class, 'receiver_id');
    }

    // Each User has many Notifications.
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Each User can have many ReturnRefundOrders.
    public function returnRefundOrders()
    {
        return $this->hasMany(ReturnRefundOrder::class);
    }
}
