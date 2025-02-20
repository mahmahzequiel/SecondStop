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
        'middle_name',  // Added middle name
        'last_name',
        'sex',
        'phone_number',
        'username',
        'email',        // Added email
        'password',     // Added password (for storing encrypted passwords)
        'profile_image'
    ];

    // Each Profile belongs to a User.
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // A Profile has many Addresses.
    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    // A Profile can have many FAQs.
    public function faqs()
    {
        return $this->hasMany(Faq::class);
    }

    // Encrypt password before saving
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }
}
