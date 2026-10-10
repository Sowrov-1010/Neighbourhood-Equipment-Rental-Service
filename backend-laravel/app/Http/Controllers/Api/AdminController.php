<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RentalRequest;
use App\Models\User;
use App\Models\Dispute;
use App\Models\AuditLog;
use App\Models\Tool;

class AdminController extends Controller
{
    /**
     * District Executive Overview & Metrics
     */
    public function dashboardMetrics()
    {
        return response()->json([
            'total_users' => User::count(),
            'total_tools' => Tool::count(),
            'active_rentals' => RentalRequest::whereIn('status', ['requested', 'payment_authorized', 'active_rental', 'pending_handover', 'return_pending'])->count(),
            'open_disputes' => Dispute::where('status', 'open')->count(),
            'blacklisted_residents' => User::where('is_blacklisted', true)->count(),
            'total_volume' => RentalRequest::where('status', 'completed')->sum('total_amount'),
        ]);
    }

    /**
     * System-Wide Transaction Master Stream (Admin Only)
     */
    public function allTransactions(Request $request)
    {
        $rentals = RentalRequest::with(['tool', 'borrower', 'lender', 'dispute'])
            ->orderBy('updated_at', 'desc')
            ->paginate(50);

        return response()->json($rentals);
    }

    /**
     * Administrative FSM Emergency Override
     */
    public function overrideFsmState(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:requested,payment_authorized,active_rental,pending_handover,return_pending,completed,disputed,cancelled',
            'reason' => 'required|string|min:5',
        ]);

        $rental = RentalRequest::findOrFail($id);
        $oldStatus = $rental->status;
        $rental->status = $validated['status'];
        $rental->save();

        AuditLog::logEvent('admin_fsm_override', auth()->id(), 'RentalRequest', $rental->id, [
            'previous_status' => $oldStatus,
            'new_status' => $rental->status,
            'reason' => $validated['reason'],
        ]);

        return response()->json([
            'message' => 'FSM state override applied.',
            'rental' => $rental,
        ]);
    }

    /**
     * Sanction / Blacklist User Management
     */
    public function toggleUserBlacklist(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $newState = !$user->is_blacklisted;

        $user->is_blacklisted = $newState;
        $user->blacklist_reason = $newState ? ($request->reason ?? 'District Administrative Sanction') : null;
        $user->blacklisted_at = $newState ? now() : null;
        $user->save();

        AuditLog::logEvent($newState ? 'user_blacklisted' : 'user_unbanned', auth()->id(), 'User', $user->id, [
            'reason' => $user->blacklist_reason,
        ]);

        return response()->json([
            'message' => $newState ? 'User penalized and blacklisted from system.' : 'User restored to good standing.',
            'user' => $user,
        ]);
    }

    /**
     * Dispute Resolution Verdict
     */
    public function resolveDispute(Request $request, $id)
    {
        $validated = $request->validate([
            'verdict' => 'required|in:favor_lender,favor_borrower,split,dismissed',
            'awarded_amount' => 'required|numeric|min:0',
            'admin_notes' => 'required|string',
        ]);

        $dispute = Dispute::findOrFail($id);
        $dispute->status = 'resolved';
        $dispute->awarded_amount = $validated['awarded_amount'];
        $dispute->resolved_by_admin_id = auth()->id();
        $dispute->admin_notes = $validated['admin_notes'];
        $dispute->resolved_at = now();
        $dispute->save();

        AuditLog::logEvent('dispute_arbitrated', auth()->id(), 'Dispute', $dispute->id, [
            'verdict' => $validated['verdict'],
            'awarded_amount' => $validated['awarded_amount'],
        ]);

        return response()->json(['message' => 'Dispute resolved successfully.', 'dispute' => $dispute]);
    }

    /**
     * Audit Log Stream
     */
    public function auditLogs()
    {
        $logs = AuditLog::with('user:id,name,email,role')
            ->orderBy('id', 'desc')
            ->limit(100)
            ->get();

        return response()->json($logs);
    }
}
