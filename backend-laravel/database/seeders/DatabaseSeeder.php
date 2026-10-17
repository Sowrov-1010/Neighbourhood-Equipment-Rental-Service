<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tool;
use App\Models\RentalRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with initial community data.
     */
    public function run(): void
    {
        // 1. Seed Hidden Admin Account with Security Code clearance (bcrypt of 2580)
        $admin = User::create([
            'name' => 'Eleanor Cross',
            'email' => 'admin@oakridge.gov',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'neighborhood' => 'District Civic Hub',
            'rating' => 5.0,
            'rating_count' => 124,
            'total_lent' => 45,
            'total_borrowed' => 8,
            'is_blacklisted' => false,
            'latitude' => 37.7749,
            'longitude' => -122.4194,
            'admin_security_hash' => Hash::make('2580'),
        ]);

        // 2. Seed Resident Accounts
        $nusrat = User::create([
            'name' => 'Nusrat Jahan',
            'email' => 'nusrat.jahan@neighborhood.org',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'neighborhood' => 'Nazrul Palace',
            'rating' => 4.95,
            'rating_count' => 38,
            'total_lent' => 24,
            'total_borrowed' => 6,
            'latitude' => 37.7790,
            'longitude' => -122.4150,
        ]);

        $rahim = User::create([
            'name' => 'Rahim Uddin',
            'email' => 'rahim.uddin@neighborhood.org',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'neighborhood' => 'Sigma Tower',
            'rating' => 4.70,
            'rating_count' => 19,
            'total_lent' => 11,
            'total_borrowed' => 14,
            'latitude' => 37.7710,
            'longitude' => -122.4230,
        ]);

        $chloe = User::create([
            'name' => 'Chloe Lin',
            'email' => 'chloe@example.com',
            'password' => Hash::make('password123'),
            'role' => 'user',
            'neighborhood' => 'Aura villa',
            'rating' => 2.40, // Red badge tier
            'rating_count' => 5,
            'total_lent' => 1,
            'total_borrowed' => 4,
            'is_blacklisted' => false,
            'latitude' => 37.7810,
            'longitude' => -122.4080,
        ]);

        // 3. Seed Equipment with Spatial Coordinates
        $tools = [
            [
                'owner_id' => $nusrat->id,
                'name' => 'DeWalt SDS-Plus Rotary Hammer 1-1/8"',
                'description' => 'Heavy duty concrete drilling hammer. Includes SDS chisels and safety goggles.',
                'category' => 'rotary_hammer',
                'pricing_type' => 'daily_rate',
                'daily_rate' => 18.00,
                'condition' => 'good',
                'brand' => 'DeWalt',
                'model_number' => 'D25133K',
                'neighborhood' => 'Nazrul Palace',
                'latitude' => 37.7790,
                'longitude' => -122.4150,
                'primary_photo_url' => 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'owner_id' => $rahim->id,
                'name' => 'Little Giant 22-Foot Multi-Position Ladder',
                'description' => 'Type 1AA 375 lb rated multi-use ladder. Converts to A-frame, extension, staircase.',
                'category' => 'ladder',
                'pricing_type' => 'free_community',
                'daily_rate' => 0.00,
                'condition' => 'pristine',
                'brand' => 'Little Giant',
                'model_number' => 'Velocity M22',
                'neighborhood' => 'Sigma Tower',
                'latitude' => 37.7710,
                'longitude' => -122.4230,
                'primary_photo_url' => 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'owner_id' => $nusrat->id,
                'name' => 'Sun Joe SPX3000 Electric Pressure Washer',
                'description' => '2030 Max PSI 1.76 GPM with Dual Soap Tanks. Perfect for patios and house siding.',
                'category' => 'pressure_washer',
                'pricing_type' => 'daily_rate',
                'daily_rate' => 22.00,
                'condition' => 'good',
                'brand' => 'Sun Joe',
                'model_number' => 'SPX3000',
                'neighborhood' => 'Nazrul Palace',
                'latitude' => 37.7790,
                'longitude' => -122.4150,
                'primary_photo_url' => 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80',
            ],
        ];

        foreach ($tools as $item) {
            $tool = Tool::create($item);
            DB::statement(
                'UPDATE tools SET location_point = ST_SRID(POINT(?, ?), 4326) WHERE id = ?',
                [$tool->longitude, $tool->latitude, $tool->id]
            );
        }

        // 4. Seed initial sample rental request
        RentalRequest::create([
            'tool_id' => 1,
            'borrower_id' => $rahim->id,
            'lender_id' => $nusrat->id,
            'status' => 'active_rental',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'total_amount' => 36.00,
            'pickup_pin_hash' => Hash::make('4821'),
            'return_pin_hash' => Hash::make('9153'),
            'handover_confirmed_at' => now()->subHours(4),
            'notes' => 'Foundation anchor bolt project.',
        ]);
    }
}
