<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Illuminate\Support\Facades\DB;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $brands = [
            ['id' => 1, 'name' => 'H&M'],
            ['id' => 2, 'name' => 'Penshoppe'],
            ['id' => 3, 'name' => 'UNIQLO'],
            ['id' => 4, 'name' => 'OXYGN'],
        ];

        foreach ($brands as $brand) {
            DB::table('brands')->updateOrInsert(
                ['id' => $brand['id']],
                ['name' => $brand['name']]
            );
        }
    }
}