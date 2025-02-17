<?php

// database/seeders/ProfilesTableSeeder.php
namespace Database\Seeders;

use App\Models\Profile;
use Illuminate\Database\Seeder;

class ProfilesTableSeeder extends Seeder
{
    public function run()
    {
        Profile::create([
            'user_id' => 1, // Assuming user_id 1 exists
            'address_id' => 1, // Assuming address_id 1 exists
            'profile_image' => 'default.jpg',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'middle_name' => 'A',
            'sex' => 'Male',
            'phone_number' => '1234567890',
        ]);

        // Add more profiles as needed
    }
}
