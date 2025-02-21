<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            // UsersTableSeeder::class,
            // ProfilesTableSeeder::class,
            RolesTableSeeder::class,
            CategoriesTableSeeder::class,
            CategoryTypeSeeder::class,
            BrandSeeder::class,
            ProductsTableSeeder::class,
        ]);
    }
}