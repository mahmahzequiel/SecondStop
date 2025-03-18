<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CartItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity'
    ];

    // Each CartItem belongs to a Cart.
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    // Each CartItem references a Product.
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
