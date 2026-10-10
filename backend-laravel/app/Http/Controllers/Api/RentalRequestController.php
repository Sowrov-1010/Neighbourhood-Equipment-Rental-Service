<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RentalRequest;
use App\Models\Tool;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RentalRequestController extends Controller
{
    /**
     * Account-Isolated Rental Track (FR-03 & Security Specification)
     * Regular accounts strictly view ONLY their own bookings (as borrower or lender).
     * No other accounts' transactions are visible.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = RentalRequest::with([
            'tool:id,name,category,daily_rate,primary_photo_url,condition',
            'borrower:id,name,email,neighborhood,rating',
            'lender:id,name,email,neighborhood,rating',
            'dispute'
        ])->forAccount($user->id);

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->whereIn('status', ['requested', 'payment_authorized', 'active_rental', 'pending_handover', 'return_pending']);
            } elseif ($request->status === 'completed') {
                $query->whereIn('status', ['completed', 'cancelled']);
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('filter_role')) {
            if ($request->filter_role === 'borrowing') {
                $query->where('borrower_id', $user->id);
            } elseif ($request->filter_role === 'lending') {
                $query->where('lender_id', $user->id);
            }
        }

        $rentals = $query->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'account_id' => $user->id,
            'is_isolated' => true,
            'data' => $rentals,
        ]);
    }

    /**
     * Create a new booking request
     * Guarded by EnsureUserIsNotBlacklisted
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'tool_id' => 'required|exists:tools,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
        ]);

        $tool = Tool::findOrFail($validated['tool_id']);

        if ($tool->owner_id === $user->id) {
            return response()->json(['error' => 'Cannot rent your own listed equipment.'], 422);
        }

        // Calculate days and total amount
        $start = \Carbon\Carbon::parse($validated['start_date']);
        $end = \Carbon\Carbon::parse($validated['end_date']);
        $days = max(1, $start->diffInDays($end) + 1);
        $totalAmount = round($days * $tool->daily_rate, 2);

        // Generate 4-digit pickup and return verification PINs
        $pickupPin = str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
        $returnPin = str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);

        $rental = RentalRequest::create([
            'tool_id' => $tool->id,
            'borrower_id' => $user->id,
            'lender_id' => $tool->owner_id,
            'status' => 'requested',
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'total_amount' => $totalAmount,
            'pickup_pin_hash' => Hash::make($pickupPin),
            'return_pin_hash' => Hash::make($returnPin),
            'expires_at' => now()->addHours(24),
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Rental request submitted to neighbor.',
            'rental' => $rental->load(['tool', 'lender']),
            'pickup_pin' => $pickupPin, // Displayed only to borrower
        ], 201);
    }

    /**
     * Authorize Payment / Accept Booking
     */
    public function authorizePayment(Request $request, $id)
    {
        $rental = RentalRequest::findOrFail($id);
        $this->authorizeParticipant($request->user(), $rental);

        $rental->transitionTo('payment_authorized');

        return response()->json(['message' => 'Payment authorized in escrow.', 'rental' => $rental]);
    }

    /**
     * Confirm In-Person Handover via PIN verification
     */
    public function verifyHandover(Request $request, $id)
    {
        $request->validate(['pin' => 'required|string']);
        $rental = RentalRequest::findOrFail($id);
        $this->authorizeParticipant($request->user(), $rental);

        if (!Hash::check($request->pin, $rental->pickup_pin_hash)) {
            return response()->json(['error' => 'Invalid pickup verification PIN.'], 422);
        }

        $rental->handover_confirmed_at = now();
        $rental->transitionTo('active_rental');

        return response()->json(['message' => 'Handover verified. Rental is now active.', 'rental' => $rental]);
    }

    /**
     * Confirm Return via PIN verification
     */
    public function verifyReturn(Request $request, $id)
    {
        $request->validate(['pin' => 'required|string']);
        $rental = RentalRequest::findOrFail($id);
        $this->authorizeParticipant($request->user(), $rental);

        if (!Hash::check($request->pin, $rental->return_pin_hash)) {
            return response()->json(['error' => 'Invalid return verification PIN.'], 422);
        }

        $rental->return_confirmed_at = now();
        $rental->transitionTo('completed');

        // Increment lending telemetry
        $rental->borrower()->increment('total_borrowed');
        $rental->lender()->increment('total_lent');

        return response()->json(['message' => 'Equipment returned. Transaction closed.', 'rental' => $rental]);
    }

    private function authorizeParticipant($user, RentalRequest $rental): void
    {
        if ($user->role !== 'admin' && $rental->borrower_id !== $user->id && $rental->lender_id !== $user->id) {
            abort(403, 'Unauthorized access to this rental transaction.');
        }
    }
}
