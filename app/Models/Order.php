<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'orders';

    protected $fillable = [
        'user_id',
        'payment_id',
        'address_id',
        'order_number',
        'subtotal',
        'shipping_cost',
        'total_amount',
        'status',
        'request_notes',
        'admin_notes',
        'request_date',
        'admin_action_date',
        'purchase_date'
    ];

    protected $dates = [
        'deleted_at', 
        'purchase_date', 
        'request_date', 
        'admin_action_date'
    ];

    /**
     * Get the payment associated with the order.
     */
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Get the address associated with the order.
     */
    public function address()
    {
        return $this->belongsTo(Address::class);
    }
    
    /**
     * Get order items.
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Check if order has a pending request
     */
    public function hasPendingRequest()
    {
        return in_array($this->status, [
            'refund_requested',
            'cancellation_requested'
        ]);
    }
}