<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            RolesTableSeeder::class,
            UsersTableSeeder::class,
            ProfilesTableSeeder::class,
            CategoriesTableSeeder::class,
            CategoryTypeSeeder::class,
            BrandSeeder::class,
            ProductsTableSeeder::class,
            AddressSeeder::class,
        ]);
    }
}