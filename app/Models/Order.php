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
        'user_id',         // Added to associate the order with the user who placed it.
        'payment_id',
        'address_id',
        'order_number',
        'subtotal',
        'shipping_cost',
        'total_amount',
        'status',
        'purchase_date'
        // 'date_time' field removed if not used.
    ];

    protected $dates = ['deleted_at', 'purchase_date'];

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
     * (Optional) If you plan to create order items later, you can add:
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
