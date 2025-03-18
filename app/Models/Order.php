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
        'purchase_date',
        'date_time',
    ];

    protected $dates = ['deleted_at', 'purchase_date', 'date_time'];

    /**
     * Define a relationship with the Payment model.
     */
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Define a relationship with the Cart model.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Define a relationship with the Address model.
     */
    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}