<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cart extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'product_id',
    ];

    /**
     * Relationship with User model.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship with Product model.
     */
    public function product()
{
    return $this->belongsTo(Product::class, 'product_id');
}


    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_cart', 'cart_id', 'order_id');
    }
}