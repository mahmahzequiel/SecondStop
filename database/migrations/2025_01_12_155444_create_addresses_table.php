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
            $table->unsignedBigInteger('user_id'); // Foreign key to users table
            $table->string('street');
            $table->string('barangay'); // ✅ Added barangay
            $table->string('city');
            $table->string('state');
            $table->string('country');
            $table->string('region'); // ✅ Added region
            $table->string('postal_code');
            $table->boolean('is_default')->default(false); // Mark default address
            $table->timestamps();
            $table->softDeletes(); // Adds `deleted_at` column

            // Foreign key constraint for user_id
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('addresses'); // This removes the table entirely, so no need for dropSoftDeletes()
    }
}
