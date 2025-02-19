<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RolesTableSeeder extends Seeder
{
    public function run()
    {
        // Insert the User role first so it gets ID 1.
        Role::create([
            'role_name' => 'Customer',
        ]);

        // Then insert the User role.
        Role::create([
            'role_name' => 'Admin',
        ]);
    }
}
