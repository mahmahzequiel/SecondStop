<?php

// app/Models/CategoryType.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoryType extends Model
{
    use HasFactory;

    protected $fillable = ['category_id', 'category_type'];

    /**
     * Define a many-to-one relationship with Category.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}