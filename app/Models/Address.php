<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'street',
        'barangay', 
        'city',
        'region',
        'state',
        'country',
        'postal_code',
        'is_default',
    ];

    // Each Address belongs to a User.
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // An Address can have many Orders.
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}