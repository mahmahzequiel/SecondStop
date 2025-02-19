<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Products;

class ProductsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Insert sample products only if they don't already exist
        Products::UpdateOrCreate(
            [
                'category_id' => 1, // Ensure this category exists in the categories table
                'product_name' => 'Laptop',
            ],
            [
                'description' => 'A high-performance laptop.',
                'price' => 1200.00,
                'brand' => 'Dell',
                'product_image' => 'images/women/tops/image1.png', // Adjust the path accordingly
            ]
        );

        Products::firstOrCreate(
            [
                'category_id' => 1,
                'product_name' => 'Smartphone',
            ],
            [
                'description' => 'A latest model smartphone.',
                'price' => 800.00,
                'brand' => 'Samsung',
                'product_image' => 'images/women/bottoms/image.png', // Adjust the path accordingly
            ]
        );

        Products::firstOrCreate(
            [
                'category_id' => 2, // Ensure this category exists in the categories table
                'product_name' => 'Tablet',
            ],
            [
                'description' => 'A lightweight and portable tablet.',
                'price' => 600.00,
                'brand' => 'Apple',
                'product_image' => 'images/women/bottoms/image1.png', // Adjust the path accordingly
            ]
        );
    }
}
