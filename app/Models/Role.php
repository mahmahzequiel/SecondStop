<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['role_name'];

    /**
     * One Role has many Users.
     * 'role_id' in users references 'roles.id'
     */
    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'id');
    }
}
