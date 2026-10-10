<?php

namespace App\Events;

use App\Models\RentalRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RentalStateUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public RentalRequest $rentalRequest;

    public function __construct(RentalRequest $rentalRequest)
    {
        $this->rentalRequest = $rentalRequest->load(['tool', 'borrower', 'lender']);
    }

    /**
     * Broadcast channels:
     * - Private channel for the Borrower
     * - Private channel for the Lender
     * - Private channel for District Administrators
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->rentalRequest->borrower_id),
            new PrivateChannel('user.' . $this->rentalRequest->lender_id),
            new PrivateChannel('admin.console'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'rental.state.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->rentalRequest->id,
            'tool_id' => $this->rentalRequest->tool_id,
            'tool_name' => $this->rentalRequest->tool->name ?? 'Equipment',
            'status' => $this->rentalRequest->status,
            'borrower_id' => $this->rentalRequest->borrower_id,
            'lender_id' => $this->rentalRequest->lender_id,
            'updated_at' => $this->rentalRequest->updated_at->toIso8601String(),
        ];
    }
}
