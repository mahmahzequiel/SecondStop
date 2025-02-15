<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAddressesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            
            // Region, Province, Barangay, etc.
            // All set to nullable since they can be NULL if not provided
            $table->string('region', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('barangay', 100)->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->string('street_name', 100)->nullable();
            $table->string('house_number', 50)->nullable();
            $table->timestamps();
            $table->softDeletes()->nullable(); 
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('addresses');
    }
}
