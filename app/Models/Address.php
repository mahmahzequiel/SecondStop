<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['region', 'province', 'barangay', 'postal_code', 'street_name', 'house_number', 'profile_id'];

    // Each Address belongs to a Profile.
    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }

    // An Address can have many Orders.
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
