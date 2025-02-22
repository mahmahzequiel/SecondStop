<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes; // Enable SoftDeletes

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['category_name']; // Only 'category_name' is needed here

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['deleted_at']; // Ensures soft delete timestamps are handled properly

    /**
     * Get the products for the category.
     */
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }
}
