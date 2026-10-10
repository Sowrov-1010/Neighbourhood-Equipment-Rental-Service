<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'event_type',
        'target_type',
        'target_id',
        'ip_address',
        'user_agent',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function logEvent(string $type, ?int $userId, ?string $targetType = null, ?int $targetId = null, array $payload = []): self
    {
        return self::create([
            'user_id' => $userId,
            'event_type' => $type,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'payload' => $payload,
            'created_at' => now(),
        ]);
    }
}
