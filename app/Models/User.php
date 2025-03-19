<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
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

    protected $dates = ['deleted_at']; 

    /**
     * A User belongs to a Role.
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    /**
     * A User has one Profile.
     */
    public function profile()
    {
        return $this->hasOne(Profile::class, 'user_id', 'id');
    }
    
    /**
     * A User can have many Orders.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
