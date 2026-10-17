<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['user', 'admin'])->default('user')->index();
            $table->string('neighborhood', 100)->default('Hamlet Tower');
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('total_lent')->default(0);
            $table->unsignedInteger('total_borrowed')->default(0);
            $table->boolean('is_blacklisted')->default(false)->index();
            $table->string('blacklist_reason')->nullable();
            $table->timestamp('blacklisted_at')->nullable();
            
            // Spatial GPS coordinates for neighborhood proximity
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            
            // Security code verification hash for administrators
            $table->string('admin_security_hash')->nullable();
            
            $table->rememberToken();
            $table->timestamps();
        });

        // MySQL 8.0+ / PostgreSQL PostGIS spatial location point
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE users ADD location POINT NULL SRID 4326 AFTER longitude'
        );
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE users ADD SPATIAL INDEX users_location_spatial_index (location)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
