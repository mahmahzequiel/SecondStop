<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    use HasFactory;

    protected $fillable = ['name']; // Allows mass assignment

    // If you have products associated with a brand, you can define a relationship
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
