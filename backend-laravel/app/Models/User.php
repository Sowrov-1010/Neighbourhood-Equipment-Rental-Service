<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'neighborhood',
        'rating',
        'rating_count',
        'total_lent',
        'total_borrowed',
        'is_blacklisted',
        'blacklist_reason',
        'blacklisted_at',
        'latitude',
        'longitude',
        'admin_security_hash',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'admin_security_hash',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_blacklisted' => 'boolean',
            'blacklisted_at' => 'datetime',
            'rating' => 'float',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    /**
     * Check if user is an Administrator
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Tools listed by this user
     */
    public function tools(): HasMany
    {
        return $this->hasMany(Tool::class, 'owner_id');
    }

    /**
     * Private Rental Track: Rentals where user is the borrower
     */
    public function rentalsAsBorrower(): HasMany
    {
        return $this->hasMany(RentalRequest::class, 'borrower_id');
    }

    /**
     * Private Rental Track: Rentals where user is the lender
     */
    public function rentalsAsLender(): HasMany
    {
        return $this->hasMany(RentalRequest::class, 'lender_id');
    }

    /**
     * Disputes filed by this user
     */
    public function filedDisputes(): HasMany
    {
        return $this->hasMany(Dispute::class, 'filed_by_id');
    }

    /**
     * Scope only active non-blacklisted residents
     */
    public function scopeActiveResidents(Builder $query): Builder
    {
        return $query->where('is_blacklisted', false);
    }
}
