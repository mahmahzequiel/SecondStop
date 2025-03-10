<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'cart_id',
        'status',
    ];

    /**
     * Get the order associated with this purchase.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the cart associated with this purchase.
     */
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }
}