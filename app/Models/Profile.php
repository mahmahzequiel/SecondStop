<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Profile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 
        'first_name', 
        'middle_name',
        'last_name',
        'sex',
        'phone_number',
        'username',
        'email',
        'password',
        'profile_image',
        'address',
    ];

    // Auto-include "full_name" when converting to JSON
    protected $appends = ['full_name'];

    /**
     * A Profile belongs to one User (one-to-one inverse).
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Accessor: combine first, middle, last names into "full_name".
     */
    public function getFullNameAttribute()
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name
        ]);
        return implode(' ', $parts);
    }

    // Example if you store password in Profile
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }
}
