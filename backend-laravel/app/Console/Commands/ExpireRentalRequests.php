<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RentalRequest;
use App\Models\AuditLog;

class ExpireRentalRequests extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'rentals:expire-ttl';

    /**
     * The console command description.
     */
    protected $description = 'Expire pending rental requests that exceeded the 24-hour response TTL window';

    public function handle(): int
    {
        $this->info('Scanning for unaccepted rental requests exceeding TTL...');

        $expired = RentalRequest::where('status', 'requested')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expired as $rental) {
            $rental->status = 'cancelled';
            $rental->save();

            AuditLog::logEvent(
                'ttl_auto_expired',
                null,
                'RentalRequest',
                $rental->id,
                ['reason' => '24h lender response timeout']
            );

            $this->warn("Rental #{$rental->id} for tool #{$rental->tool_id} marked CANCELLED due to TTL expiration.");
        }

        $this->info("Completed. {$expired->count()} requests expired.");
        return Command::SUCCESS;
    }
}
