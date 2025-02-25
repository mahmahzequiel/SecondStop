<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        DB::table('addresses')->insert([
            [
                'user_id' => 1, // Link to user with ID 1
                'street' => '123 Quezon Avenue',
                'barangay' => 'Barangay Lahug',
                'city' => 'Quezon City',
                'state' => 'Metro Manila',
                'region' => 'NCR', // ✅ Added region
                'country' => 'Philippines',
                'postal_code' => '1105',
                'is_default' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'user_id' => 1, // Link to user with ID 1
                'street' => '456 Ayala Street',
                'barangay' => 'Barangay Commonwealth',
                'city' => 'Cebu City',
                'state' => 'Cebu',
                'region' => 'Region VII', // ✅ Added region
                'country' => 'Philippines',
                'postal_code' => '6000',
                'is_default' => false,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'user_id' => 2, // Link to user with ID 2
                'street' => '789 Governor’s Drive',
                'barangay' => 'Barangay Lahug',
                'city' => 'Dasmarinas',
                'state' => 'Cavite',
                'region' => 'Region VII', // ✅ Added region
                'country' => 'Philippines',
                'postal_code' => '4114',
                'is_default' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}