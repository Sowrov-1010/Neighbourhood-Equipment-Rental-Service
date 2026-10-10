<?php

use Illuminate\Support\Facades\Schedule;

// Laravel 11 Task Scheduler (php artisan schedule:run)
// Runs TTL check every minute to auto-expire stale equipment booking requests
Schedule::command('rentals:expire-ttl')
    ->everyMinute()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/rentals_ttl.log'));

// Runs overdue inspection hourly and calculates neighbor trust metric sanctions
Schedule::command('rentals:check-overdue')
    ->hourly()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/rentals_overdue.log'));
