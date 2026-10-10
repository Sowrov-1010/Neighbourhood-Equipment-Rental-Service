<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_request_id')->constrained('rental_requests')->onDelete('cascade');
            $table->foreignId('filed_by_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('against_user_id')->constrained('users')->onDelete('cascade');
            
            $table->enum('reason', [
                'late_return',
                'equipment_damage',
                'missing_accessories',
                'incorrect_item',
                'safety_hazard',
                'no_show'
            ]);
            $table->text('description');
            $table->json('evidence_photos')->nullable();
            
            $table->enum('status', ['open', 'under_investigation', 'resolved', 'escalated'])->default('open')->index();
            $table->decimal('claimed_amount', 8, 2)->default(0.00);
            $table->decimal('awarded_amount', 8, 2)->default(0.00);
            
            $table->foreignId('resolved_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 80)->index(); // 'fsm_transition', 'admin_override', 'security_login', 'dispute_verdict'
            $table->string('target_type', 80)->nullable(); // 'RentalRequest', 'User', 'Tool'
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->string('needed_category', 60);
            $table->date('urgency_date');
            $table->enum('status', ['open', 'matched', 'expired'])->default('open')->index();
            $table->unsignedInteger('replies_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('disputes');
    }
};
