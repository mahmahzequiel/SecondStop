<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Women's Top
        Product::updateOrCreate(
            [
                'category_id'       => 2, // example: Women's Apparel
                'category_type_id'  => 1, // example: Tops
                'product_name'      => "Women's Top",
            ],
            [
                'description'   => "Nice women's top.",
                'price'         => 1200.00,
                'brand_id'      => 1, // H&M
                // This matches the file in public/images/women/tops/image1.png
                'product_image' => 'images/women/tops/image1.png',
            ]
        );

        // Men's Pants #1
        Product::updateOrCreate(
            [
                'category_id'      => 1, // e.g. Men's Apparel
                'category_type_id' => 2, // e.g. Bottoms
                'product_name'     => "Men's Pants",
            ],
            [
                'description'   => "Comfortable women's pants.",
                'price'         => 800.00,
                'brand_id'      => 2, // Penshoppe
                // Must match the actual file in public/images/women/bottoms/image.png
                'product_image' => 'images/women/bottoms/image.png',
            ]
        );

        // Women's Bag
        Product::updateOrCreate(
            [
                'category_id'      => 2, // e.g. Women's Apparel
                'category_type_id' => 2, // e.g. Accessories
                'product_name'     => "Women's Bag",
            ],
            [
                'description'   => "Stylish women's bag.",
                'price'         => 600.00,
                'brand_id'      => 3, // UNIQLO
                'product_image' => 'images/women/bottoms/image1.png',
            ]
        );

        // Another Men's Pants #2
        Product::updateOrCreate(
            [
                'category_id'      => 1, // Men's Apparel
                'category_type_id' => 2, // Bottoms
                'product_name'     => "Men's Pants",
            ],
            [
                'description'   => "Comfortable women's pants.",
                'price'         => 800.00,
                'brand_id'      => 2, // Penshoppe
                'product_image' => 'images/women/bottoms/image.png',
            ]
        );

        // Another Men's Pants #3 (example)
        Product::updateOrCreate(
            [
                'category_id'      => 3, // Maybe Kid's Apparel?
                'category_type_id' => 1, // e.g. Bottoms
                'product_name'     => "Men's Pants",
            ],
            [
                'description'   => "Comfortable kid's pants.",
                'price'         => 800.00,
                'brand_id'      => 2, // Penshoppe
                'product_image' => 'images/women/bottoms/image.png',
            ]
        );
    }
}
