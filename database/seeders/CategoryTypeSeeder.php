<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CategoryType;

class CategoryTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Insert sample category types
        $categoryTypes = [
            ['id' => 1, 'category_type' => 'Tops'],
            ['id' => 2, 'category_type' => 'Bottoms'],
        ];

        foreach ($categoryTypes as $type) {
            // Create the category type
            CategoryType::create([
                'id' => $type['id'],
                'category_type' => $type['category_type'],
            ]);
        }
    }
}