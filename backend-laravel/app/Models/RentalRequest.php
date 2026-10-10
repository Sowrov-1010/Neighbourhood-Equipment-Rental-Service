<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use App\Events\RentalStateUpdated;

class RentalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'tool_id',
        'borrower_id',
        'lender_id',
        'status',
        'start_date',
        'end_date',
        'total_amount',
        'deposit_held',
        'pickup_pin_hash',
        'return_pin_hash',
        'handover_confirmed_at',
        'return_confirmed_at',
        'expires_at',
        'is_overdue',
        'overdue_hours',
        'borrower_rating',
        'borrower_review',
        'lender_rating',
        'lender_review',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'total_amount' => 'float',
            'deposit_held' => 'float',
            'handover_confirmed_at' => 'datetime',
            'return_confirmed_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_overdue' => 'boolean',
        ];
    }

    public function tool(): BelongsTo
    {
        return $this->belongsTo(Tool::class, 'tool_id');
    }

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function lender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lender_id');
    }

    public function dispute(): HasOne
    {
        return $this->hasOne(Dispute::class, 'rental_request_id');
    }

    /**
     * Account-Isolated Scope: Enforces that a regular resident can ONLY see rentals
     * where they are either the Borrower or the Lender.
     */
    public function scopeForAccount(Builder $query, int $userId): Builder
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('borrower_id', $userId)
              ->orWhere('lender_id', $userId);
        });
    }

    /**
     * Scope active in-progress rentals
     */
    public function scopeActiveWorkflows(Builder $query): Builder
    {
        return $query->whereIn('status', [
            'requested',
            'payment_authorized',
            'active_rental',
            'pending_handover',
            'return_pending'
        ]);
    }

    /**
     * Advance State Machine with validation and Reverb WebSocket dispatch
     */
    public function transitionTo(string $newStatus, ?string $actorId = null): bool
    {
        $validTransitions = [
            'requested' => ['payment_authorized', 'cancelled'],
            'payment_authorized' => ['active_rental', 'cancelled'],
            'active_rental' => ['pending_handover', 'return_pending', 'disputed'],
            'pending_handover' => ['active_rental', 'disputed'],
            'return_pending' => ['completed', 'disputed'],
            'disputed' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => [],
        ];

        if (!isset($validTransitions[$this->status]) || !in_array($newStatus, $validTransitions[$this->status])) {
            throw new \DomainException("Illegal FSM transition from {$this->status} to {$newStatus}");
        }

        $this->status = $newStatus;
        $this->save();

        // Broadcast real-time change via Laravel Reverb
        broadcast(new RentalStateUpdated($this))->toOthers();

        return true;
    }
}
