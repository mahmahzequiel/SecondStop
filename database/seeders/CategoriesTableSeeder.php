<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Category;

class CategoriesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
      

        // Insert sample categories with explicit IDs
        Category::insert([
            ['id' => 1, 'category_name' => 'Electronics', 'category_type' => 'Digital'],
            ['id' => 2, 'category_name' => 'Fashion', 'category_type' => 'Clothing'],
            ['id' => 3, 'category_name' => 'Home & Kitchen', 'category_type' => 'Appliances'],
        ]);
    }
}