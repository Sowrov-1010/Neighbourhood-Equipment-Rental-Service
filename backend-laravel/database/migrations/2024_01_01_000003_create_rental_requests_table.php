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
        Schema::create('rental_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_id')->constrained('tools')->onDelete('cascade');
            $table->foreignId('borrower_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('lender_id')->constrained('users')->onDelete('cascade');
            
            // FSM State Machine
            $table->enum('status', [
                'requested',
                'payment_authorized',
                'active_rental',
                'pending_handover',
                'return_pending',
                'completed',
                'disputed',
                'cancelled'
            ])->default('requested')->index();

            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_amount', 8, 2)->default(0.00);
            $table->decimal('deposit_held', 8, 2)->default(0.00);
            
            // Verification Security PINs (4-digit cryptographic exchange handshake)
            $table->string('pickup_pin_hash')->nullable();
            $table->string('return_pin_hash')->nullable();
            $table->timestamp('handover_confirmed_at')->nullable();
            $table->timestamp('return_confirmed_at')->nullable();
            
            // Task Scheduler TTL & Overdue monitoring
            $table->timestamp('expires_at')->nullable()->index();
            $table->boolean('is_overdue')->default(false)->index();
            $table->unsignedInteger('overdue_hours')->default(0);

            // Lender & Borrower reviews
            $table->unsignedTinyInteger('borrower_rating')->nullable();
            $table->text('borrower_review')->nullable();
            $table->unsignedTinyInteger('lender_rating')->nullable();
            $table->text('lender_review')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            // Strict Compound Indexes for Account-Isolated Rental Tracks
            $table->index(['borrower_id', 'status']);
            $table->index(['lender_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rental_requests');
    }
};
