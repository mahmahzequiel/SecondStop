<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; // Add this line

class Product extends Model
{
    use HasFactory, SoftDeletes; // Enable SoftDeletes

    protected $fillable = [
        'category_id',
        'category_type_id',
        'brand_id',
        'product_name',
        'description',
        'price',
        'quantity',  // Add this line
        'product_image',
        'sack_id',
    ];

    protected $dates = ['deleted_at']; // Ensure this is present

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
     * Get the carts that contain this product.
     */
    public function carts()
    {
        return $this->hasMany(Cart::class, 'product_id');
    }

    public function sack()
    {
        return $this->belongsTo(Sacks::class, 'sack_id');
    }

}