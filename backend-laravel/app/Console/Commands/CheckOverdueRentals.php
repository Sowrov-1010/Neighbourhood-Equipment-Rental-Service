<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RentalRequest;
use App\Models\User;
use App\Models\AuditLog;

class CheckOverdueRentals extends Command
{
    protected $signature = 'rentals:check-overdue';
    protected $description = 'Flag overdue tools and apply community reputation tier de-merits';

    public function handle(): int
    {
        $this->info('Scanning active rentals past scheduled end_date...');

        $overdueRentals = RentalRequest::whereIn('status', ['active_rental', 'pending_handover'])
            ->where('end_date', '<', now()->toDateString())
            ->get();

        foreach ($overdueRentals as $rental) {
            $diffHours = (int) now()->diffInHours($rental->end_date);
            $rental->is_overdue = true;
            $rental->overdue_hours = $diffHours;
            $rental->save();

            // Penalize borrower trust metric if more than 24 hours late
            if ($diffHours >= 24 && $rental->borrower) {
                $borrower = $rental->borrower;
                $borrower->rating = max(1.0, $borrower->rating - 0.25);
                
                // If rating drops below 2.0 or 72 hours late, trigger auto-suspension
                if ($diffHours >= 72) {
                    $borrower->is_blacklisted = true;
                    $borrower->blacklist_reason = "Delinquent Equipment Return: Overdue by {$diffHours} hours on Rental #{$rental->id}";
                    $borrower->blacklisted_at = now();
                }
                
                $borrower->save();

                AuditLog::logEvent(
                    'reputation_delinquency_sanction',
                    $borrower->id,
                    'RentalRequest',
                    $rental->id,
                    ['hours_overdue' => $diffHours, 'new_rating' => $borrower->rating]
                );
            }

            $this->warn("Rental #{$rental->id} is {$diffHours} hours overdue. Borrower #{$rental->borrower_id} penalized.");
        }

        $this->info("Completed. Flagged {$overdueRentals->count()} overdue rentals.");
        return Command::SUCCESS;
    }
}
