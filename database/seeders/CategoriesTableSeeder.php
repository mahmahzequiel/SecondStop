<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
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
        // Insert sample categories
        $categories = [
            ['id' => 1, 'category_name' => "Men's Apparel"],
            ['id' => 2, 'category_name' => "Women's Apparel"],
            ['id' => 3, 'category_name' => "Kid's Apparel"],
        ];

        foreach ($categories as $category) {
            // Create the category
            Category::create([
                'id' => $category['id'],
                'category_name' => $category['category_name'],
            ]);
        }
    }
}