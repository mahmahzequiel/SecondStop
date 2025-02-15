<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProfilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();

            // Foreign key to users table
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade'); 
            // onDelete('cascade') → if a user is deleted, the related profile will also be deleted
            

            // Foreign key to addresses table 
            $table->unsignedBigInteger('address_id')->nullable();
            $table->foreign('address_id')
                  ->references('id')
                  ->on('addresses')
                  ->onDelete('cascade');
            // Or use onDelete('set null') if you don't want to delete the profile when the address is removed

            
            // Name fields
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();

            // Profile image: text type (can store full path or base64, etc.)
            $table->text('profile_image')->nullable();

            // Phone number, up to 15 chars
            $table->string('phone_number', 15)->nullable();

            // Gender, as an enum
            $table->enum('sex', ['male', 'female', 'other'])->nullable(); 
        
     
            // Timestamps
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
        Schema::dropIfExists('profiles');
    }
}
