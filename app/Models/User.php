<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;


    protected $fillable = [
        "role_id",
        "username",
        "email",
        "password",
    ];

    /**
     * A User belongs to one Role.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}
    
