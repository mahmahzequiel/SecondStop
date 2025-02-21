<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Products;

class ProductsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Insert sample products only if they don't already exist
        Products::updateOrCreate(
            [
                'category_id' => 2, // Women's Apparel
                'category_type_id' => 1, // Tops
                'product_name' => "Women's Top",
            ],
            [
                'description' => "Nice women's top.",
                'price' => 1200.00,
                'brand_id' => 1, // H&M
                'product_image' => 'images/women/tops/image1.png',
            ]
        );

        Products::updateOrCreate(
            [
                'category_id' => 1, // Women's Apparel
                'category_type_id' => 2, // Bottoms
                'product_name' => "Men's Pants",
            ],
            [
                'description' => "Comfortable women's pants.",
                'price' => 800.00,
                'brand_id' => 2, // Penshoppe
                'product_image' => 'images/women/bottoms/image.png',
            ]
        );

        Products::updateOrCreate(
            [
                'category_id' => 2, // Women's Apparel
                'category_type_id' => 2, // Accessories
                'product_name' => "Women's Bag",
            ],
            [
                'description' => "Stylish women's bag.",
                'price' => 600.00,
                'brand_id' => 3, // UNIQLO
                'product_image' => 'images/women/bottoms/image1.png',
            ]
        );

        Products::updateOrCreate(
            [
                'category_id' => 1, // men's Apparel
                'category_type_id' => 2, // Bottoms
                'product_name' => "Men's Pants",
            ],
            [
                'description' => "Comfortable women's pants.",
                'price' => 800.00,
                'brand_id' => 2, // Penshoppe
                'product_image' => 'images/women/bottoms/image.png',
            ]
        );
        Products::updateOrCreate(
            [
                'category_id' => 3, // Women's Apparel
                'category_type_id' => 1, // Bottoms
                'product_name' => "Men's Pants",
            ],
            [
                'description' => "Comfortable kid's pants.",
                'price' => 800.00,
                'brand_id' => 2, // Penshoppe
                'product_image' => 'images/women/bottoms/image.png',
            ]
        );
    }
}