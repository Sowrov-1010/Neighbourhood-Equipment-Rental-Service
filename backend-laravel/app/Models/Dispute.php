<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_request_id',
        'filed_by_id',
        'against_user_id',
        'reason',
        'description',
        'evidence_photos',
        'status',
        'claimed_amount',
        'awarded_amount',
        'resolved_by_admin_id',
        'admin_notes',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'evidence_photos' => 'array',
            'claimed_amount' => 'float',
            'awarded_amount' => 'float',
            'resolved_at' => 'datetime',
        ];
    }

    public function rentalRequest(): BelongsTo
    {
        return $this->belongsTo(RentalRequest::class);
    }

    public function filedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'filed_by_id');
    }

    public function againstUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'against_user_id');
    }

    public function resolvedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_admin_id');
    }
}
