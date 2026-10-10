<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tool;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ToolController extends Controller
{
    /**
     * Search and list tools with optional MySQL ST_Distance_Sphere radial calculation
     */
    public function index(Request $request)
    {
        $query = Tool::with('owner:id,name,neighborhood,rating,is_blacklisted')
            ->where('is_available', true);

        // Radial Proximity Search via GPS coordinates
        if ($request->filled(['lat', 'lng'])) {
            $lat = (float) $request->lat;
            $lng = (float) $request->lng;
            $radiusKm = (float) ($request->radius_km ?? 15.0);

            $query->withinDistanceSphere($lat, $lng, $radiusKm);
        }

        // Category filter
        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Search term query
        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('description', 'like', $term)
                  ->orWhere('brand', 'like', $term);
            });
        }

        $tools = $query->paginate(24);

        return response()->json($tools);
    }

    /**
     * Store a newly created listing with Picture Uploads
     * Guarded by EnsureUserIsNotBlacklisted middleware
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'category' => 'required|string|max:60',
            'pricing_type' => 'required|in:free_community,daily_rate,hourly_rate',
            'daily_rate' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'condition' => 'required|in:pristine,good,fair,heavy_duty',
            'brand' => 'nullable|string|max:80',
            'model_number' => 'nullable|string|max:100',
            'neighborhood' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'primary_photo_url' => 'nullable|string',
            'photos' => 'nullable|array',
            'photos.*' => 'file|image|max:10240', // Supports direct file uploads up to 10MB
            'photo_base64' => 'nullable|string',
        ]);

        $photoUrls = [];

        // Handle uploaded file images
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $path = $file->store('tools/' . $user->id, 'public');
                $photoUrls[] = Storage::disk('public')->url($path);
            }
        }

        // Handle base64 encoded photo uploads
        if (!empty($validated['photo_base64']) && str_starts_with($validated['photo_base64'], 'data:image')) {
            $imageData = preg_replace('#^data:image/\w+;base64,#i', '', $validated['photo_base64']);
            $decoded = base64_decode($imageData);
            $filename = 'tools/' . $user->id . '/' . Str::random(24) . '.jpg';
            Storage::disk('public')->put($filename, $decoded);
            $photoUrls[] = Storage::disk('public')->url($filename);
        }

        if (!empty($validated['primary_photo_url'])) {
            $photoUrls[] = $validated['primary_photo_url'];
        }

        $primaryUrl = !empty($photoUrls) ? $photoUrls[0] : 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';

        $tool = Tool::create([
            'owner_id' => $user->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'pricing_type' => $validated['pricing_type'],
            'daily_rate' => $validated['daily_rate'] ?? 0.0,
            'hourly_rate' => $validated['hourly_rate'] ?? 0.0,
            'condition' => $validated['condition'],
            'brand' => $validated['brand'] ?? null,
            'model_number' => $validated['model_number'] ?? null,
            'photo_urls' => $photoUrls,
            'primary_photo_url' => $primaryUrl,
            'is_available' => true,
            'neighborhood' => $validated['neighborhood'] ?? $user->neighborhood,
            'latitude' => $validated['latitude'] ?? $user->latitude ?? 37.7749,
            'longitude' => $validated['longitude'] ?? $user->longitude ?? -122.4194,
        ]);

        // Insert spatial point in MySQL 8.0+
        \Illuminate\Support\Facades\DB::statement(
            'UPDATE tools SET location_point = ST_SRID(POINT(?, ?), 4326) WHERE id = ?',
            [$tool->longitude, $tool->latitude, $tool->id]
        );

        AuditLog::logEvent('tool_created', $user->id, 'Tool', $tool->id);

        return response()->json([
            'message' => 'Tool listed successfully.',
            'tool' => $tool->load('owner:id,name,neighborhood,rating'),
        ], 201);
    }

    public function show($id)
    {
        $tool = Tool::with('owner:id,name,neighborhood,rating,is_blacklisted')->findOrFail($id);
        return response()->json($tool);
    }
}
