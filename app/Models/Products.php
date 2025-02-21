<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Products extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'category_type_id',
        'brand_id',
        'product_name',
        'description',
        'price',
        'product_image',
    ];

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
}