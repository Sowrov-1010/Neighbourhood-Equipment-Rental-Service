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
        Schema::create('tools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 60)->index(); // 'rotary_hammer', 'ladder', 'pressure_washer', etc.
            
            // Pricing model (Non-consumable zero-deposit neighborhood sharing)
            $table->enum('pricing_type', ['free_community', 'daily_rate', 'hourly_rate'])->default('free_community');
            $table->decimal('daily_rate', 8, 2)->default(0.00);
            $table->decimal('hourly_rate', 8, 2)->default(0.00);
            
            // Hardware condition & specs
            $table->enum('condition', ['pristine', 'good', 'fair', 'heavy_duty'])->default('good');
            $table->string('brand', 80)->nullable();
            $table->string('model_number', 100)->nullable();
            
            // Picture uploads (Multi-photo array, primary thumbnail)
            $table->json('photo_urls')->nullable();
            $table->string('primary_photo_url')->nullable();
            
            // Availability and security
            $table->boolean('is_available')->default(true)->index();
            $table->boolean('requires_admin_review')->default(false);
            $table->string('neighborhood', 100);
            
            // Coordinates
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            
            $table->timestamps();
            $table->softDeletes();
        });

        // MySQL 8.0+ Spatial point column and Spatial Index for ST_Distance_Sphere
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE tools ADD location_point POINT NOT NULL SRID 4326 AFTER longitude'
        );
        \Illuminate\Support\Facades\DB::statement(
            'ALTER TABLE tools ADD SPATIAL INDEX tools_location_spatial_idx (location_point)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tools');
    }
};
