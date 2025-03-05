<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'payment_id', 'address_id', 'order_number', 
        'subtotal', 'shipping_cost', 'total_amount', 'status', 'purchase_date'
    ];

    protected $casts = [
        'purchase_date' => 'datetime',
    ];

    /**
     * Define relationship with carts (Pivot Table)
     */
    public function carts()
    {
        return $this->belongsToMany(Cart::class, 'order_cart', 'order_id', 'cart_id')
                    ->with('product'); // Eager load the product relationship
    }

    


    /**
     * Define relationship with payment.
     */
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Define relationship with address.
     */
    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    /**
     * Define relationship with purchases.
     */
    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'order_id');
    }
}
