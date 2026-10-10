<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ToolController;
use App\Http\Controllers\Api\RentalRequestController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes - Neighborhood Equipment Sharing Platform
|--------------------------------------------------------------------------
*/

// Public Authentication Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Hidden Administrative Access Gateway (Requires special security code)
Route::post('/auth/admin/login', [AuthController::class, 'adminLogin']);
Route::post('/auth/admin/register', [AuthController::class, 'adminRegister']);

// Public Tools Directory with Spatial Proximity Search
Route::get('/tools', [ToolController::class, 'index']);
Route::get('/tools/{id}', [ToolController::class, 'show']);

// Authenticated Resident & Admin Routes (Sanctum Guarded)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Non-blacklisted actions (Guarded by EnsureUserIsNotBlacklisted)
    Route::middleware('user.not.blacklisted')->group(function () {
        Route::post('/tools', [ToolController::class, 'store']);
        Route::post('/rentals', [RentalRequestController::class, 'store']);
        Route::post('/rentals/{id}/payment', [RentalRequestController::class, 'authorizePayment']);
        Route::post('/rentals/{id}/handover', [RentalRequestController::class, 'verifyHandover']);
        Route::post('/rentals/{id}/return', [RentalRequestController::class, 'verifyReturn']);
    });

    // Account-Isolated Rental Track (Users only view their own rentals)
    Route::get('/my-rentals', [RentalRequestController::class, 'index']);

    // Dedicated Hidden Admin Area (Guarded by EnsureAdminWithSecurityCode)
    Route::prefix('admin')->middleware(['admin.clearance'])->group(function () {
        Route::get('/metrics', [AdminController::class, 'dashboardMetrics']);
        Route::get('/transactions', [AdminController::class, 'allTransactions']);
        Route::post('/transactions/{id}/override', [AdminController::class, 'overrideFsmState']);
        Route::post('/users/{id}/toggle-blacklist', [AdminController::class, 'toggleUserBlacklist']);
        Route::post('/disputes/{id}/resolve', [AdminController::class, 'resolveDispute']);
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
    });
});
