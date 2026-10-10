<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Standard Resident Registration
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'neighborhood' => 'required|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'neighborhood' => $validated['neighborhood'],
            'rating' => 5.0,
            'rating_count' => 0,
            'latitude' => $validated['latitude'] ?? 37.7749,
            'longitude' => $validated['longitude'] ?? -122.4194,
        ]);

        $token = $user->createToken('resident_auth')->plainTextToken;

        AuditLog::logEvent('resident_registered', $user->id, 'User', $user->id);

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Standard Resident Login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password credentials provided.'],
            ]);
        }

        $token = $user->createToken('resident_auth')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Hidden Administrative Gateway Login
     * Requires Email, Password, AND Special Security Code (2580)
     * No hints leaked on failure.
     */
    public function adminLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'security_code' => 'required|string',
        ]);

        // Validate security code against secret protocol
        $masterCode = config('auth.admin_master_code', '2580');
        if (trim($request->security_code) !== $masterCode) {
            AuditLog::logEvent('admin_security_breach_attempt', null, 'Auth', null, [
                'email' => $request->email,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'error' => 'ACCESS_DENIED',
                'message' => 'Access Denied: Invalid Administrative Security Code.',
            ], 403);
        }

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password) || $user->role !== 'admin') {
            return response()->json([
                'error' => 'CREDENTIALS_INVALID',
                'message' => 'Administrative credentials unverified.',
            ], 401);
        }

        $token = $user->createToken('admin_executive_auth', ['admin:access'])->plainTextToken;

        AuditLog::logEvent('admin_authenticated', $user->id, 'User', $user->id, [
            'clearance' => 'level_4',
        ]);

        return response()->json([
            'message' => 'Administrative clearance granted.',
            'user' => $user,
            'token' => $token,
            'role' => 'admin',
        ]);
    }

    /**
     * Hidden Administrative Provisioning / Registration
     */
    public function adminRegister(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'security_code' => 'required|string',
            'district_key' => 'required|string',
        ]);

        $masterCode = config('auth.admin_master_code', '2580');
        if (trim($request->security_code) !== $masterCode) {
            return response()->json([
                'error' => 'AUTHORIZATION_DENIED',
                'message' => 'Security Authorization Denied: Invalid Administrative Security Code.',
            ], 403);
        }

        $user = User::create([
            'name' => $validated['name'] ?? $request->name,
            'email' => strtolower($request->email),
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'neighborhood' => 'District Administrative Center',
            'rating' => 5.0,
            'admin_security_hash' => Hash::make($request->security_code),
        ]);

        $token = $user->createToken('admin_executive_auth', ['admin:access'])->plainTextToken;

        AuditLog::logEvent('admin_provisioned', $user->id, 'User', $user->id);

        return response()->json([
            'message' => 'Administrative personnel registered successfully.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Signed out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
