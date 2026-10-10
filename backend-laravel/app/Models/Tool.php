<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class Tool extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'category',
        'pricing_type',
        'daily_rate',
        'hourly_rate',
        'condition',
        'brand',
        'model_number',
        'photo_urls',
        'primary_photo_url',
        'is_available',
        'requires_admin_review',
        'neighborhood',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'photo_urls' => 'array',
            'daily_rate' => 'float',
            'hourly_rate' => 'float',
            'is_available' => 'boolean',
            'requires_admin_review' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function rentalRequests(): HasMany
    {
        return $this->hasMany(RentalRequest::class, 'tool_id');
    }

    /**
     * Radial Proximity Search using MySQL ST_Distance_Sphere or PostGIS ST_Distance
     * Computes the great-circle geodesic distance in meters between user GPS and item location.
     *
     * @param Builder $query
     * @param float $userLat
     * @param float $userLng
     * @param float $radiusKm
     */
    public function scopeWithinDistanceSphere(Builder $query, float $userLat, float $userLng, float $radiusKm = 10.0): Builder
    {
        $radiusMeters = $radiusKm * 1000.0;

        // MySQL 8.0+ Spatial Query with ST_Distance_Sphere
        // Note: POINT(longitude, latitude) is standard GIS WKT ordering
        return $query
            ->select('tools.*')
            ->selectRaw(
                'ST_Distance_Sphere(POINT(longitude, latitude), POINT(?, ?)) as distance_meters',
                [$userLng, $userLat]
            )
            ->whereRaw(
                'ST_Distance_Sphere(POINT(longitude, latitude), POINT(?, ?)) <= ?',
                [$userLng, $userLat, $radiusMeters]
            )
            ->orderBy('distance_meters', 'asc');
    }

    /**
     * Scope only available equipment owned by non-blacklisted residents
     */
    public function scopeAvailableInNeighborhood(Builder $query): Builder
    {
        return $query->where('is_available', true)
            ->where('requires_admin_review', false)
            ->whereHas('owner', function ($q) {
                $q->where('is_blacklisted', false);
            });
    }
}
