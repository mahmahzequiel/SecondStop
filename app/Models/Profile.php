<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Profile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'first_name', 'last_name',
        'profile_image', 'phone_number', 'sex'
        // Note: We removed 'address_id' because now a profile has many addresses.
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
}
