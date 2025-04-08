<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sacks extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'category_type_id',
        'total_items',
        'available_items',
        'sold_items',
        'sack_code',
        'estimated_pieces',
        'buying_price',
    ];

    /**
     * Get the category that owns the sack
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the category type that owns the sack
     */
    public function categoryType()
    {
        return $this->belongsTo(CategoryType::class, 'category_type_id');
    }
}