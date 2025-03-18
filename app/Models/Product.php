<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'category_type_id',
        'brand_id',
        'product_name',
        'description',
        'price',
        'product_image',
    ];

    protected $dates = ['deleted_at'];

    /**
     * Get the URL for the product image
     */
    public function getImageUrlAttribute()
    {
        if (!$this->product_image) {
            return asset('images/placeholder.png');
        }
        
        if (strpos($this->product_image, 'http') === 0) {
            return $this->product_image;
        }
        
        return asset('storage/' . $this->product_image);
    }

    /**
     * Get the category that owns the product.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the category type that owns the product.
     */
    public function categoryType()
    {
        return $this->belongsTo(CategoryType::class, 'category_type_id');
    }

    /**
     * Get the brand that owns the product.
     */
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get all cart items that contain this product
     */
    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Get the orders that include this product
     */
    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_items')
                    ->withPivot('quantity', 'price')
                    ->withTimestamps();
    }
}