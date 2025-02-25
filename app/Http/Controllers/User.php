<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserController extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        "role_id",
        "first_name",
        "middle_name",
        "last_name",
        "sex",
        "phone_number",
        "username",
        "email",
        "password",
    ];

    protected $hidden = [
        "password",
        "remember_token",
    ];

    protected $casts = [
        "email_verified_at" => "datetime",
    ];

    /**
     * A User belongs to one Role (optional, if you use roles).
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * A User has one Profile (one-to-one relationship).
     * The 'user_id' column in the 'profiles' table references this user's 'id'.
     */
    public function profile()
    {
        return $this->hasOne(Profile::class, 'user_id', 'id');
    }
}
