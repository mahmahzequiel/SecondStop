<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notifications extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id', 'order_id', 'title', 'description', 'is_read'];

    // Each Notification belongs to a User.
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Each Notification belongs to an Order (if applicable).
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
