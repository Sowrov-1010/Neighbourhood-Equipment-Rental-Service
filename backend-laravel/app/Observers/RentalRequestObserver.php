<?php

namespace App\Observers;

use App\Models\RentalRequest;
use App\Models\AuditLog;
use App\Events\RentalStateUpdated;

class RentalRequestObserver
{
    /**
     * Handle the RentalRequest "created" event.
     */
    public function created(RentalRequest $rentalRequest): void
    {
        AuditLog::logEvent(
            'rental_requested',
            $rentalRequest->borrower_id,
            'RentalRequest',
            $rentalRequest->id,
            [
                'tool_id' => $rentalRequest->tool_id,
                'lender_id' => $rentalRequest->lender_id,
                'dates' => [$rentalRequest->start_date, $rentalRequest->end_date],
            ]
        );

        event(new RentalStateUpdated($rentalRequest));
    }

    /**
     * Handle the RentalRequest "updated" event.
     */
    public function updated(RentalRequest $rentalRequest): void
    {
        if ($rentalRequest->isDirty('status')) {
            $from = $rentalRequest->getOriginal('status');
            $to = $rentalRequest->status;

            AuditLog::logEvent(
                'fsm_state_transition',
                auth()->id() ?? $rentalRequest->borrower_id,
                'RentalRequest',
                $rentalRequest->id,
                [
                    'previous_status' => $from,
                    'new_status' => $to,
                    'tool_id' => $rentalRequest->tool_id,
                ]
            );

            event(new RentalStateUpdated($rentalRequest));
        }
    }
}
