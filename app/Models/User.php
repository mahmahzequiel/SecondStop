<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes; // Added SoftDeletes in case you use it

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
     * A User belongs to one Role.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}
