<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full bg-stone-50">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Neighborhood Equipment Sharing') }}</title>

    <!-- Tailwind CSS (Vite) -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <!-- Leaflet Geospatial CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
</head>
<body class="font-sans antialiased text-stone-900 min-h-full flex flex-col">
    <!-- Navigation Header -->
    <header class="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="{{ route('tools.index') }}" class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-stone-950">
                        ⚡
                    </div>
                    <div>
                        <span class="font-bold text-stone-900 tracking-tight text-sm">Oakridge Equipment Network</span>
                        <div class="text-[10px] text-stone-500 font-mono">Neighborhood Sharing</div>
                    </div>
                </a>
            </div>

            <!-- Navigation Links -->
            <nav class="flex items-center gap-1 sm:gap-2">
                <a href="{{ route('tools.index') }}" class="px-3 py-1.5 rounded-lg text-xs font-semibold {{ request()->routeIs('tools.*') ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:text-stone-900' }}">
                    Equipment Directory
                </a>
                @auth
                    <a href="{{ route('rentals.index') }}" class="px-3 py-1.5 rounded-lg text-xs font-semibold {{ request()->routeIs('rentals.*') ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:text-stone-900' }}">
                        My Private Rental Track
                    </a>
                    @if(auth()->user()->isAdmin())
                        <a href="{{ route('admin.dashboard') }}" class="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
                            District Admin Console
                        </a>
                    @endif
                @endauth
            </nav>

            <!-- Auth Buttons -->
            <div class="flex items-center gap-2">
                @auth
                    <div class="text-right hidden sm:block">
                        <div class="text-xs font-bold text-stone-900">{{ auth()->user()->name }}</div>
                        <div class="text-[10px] text-stone-500 font-mono">{{ auth()->user()->neighborhood }} &middot; {{ number_format(auth()->user()->rating, 1) }}★</div>
                    </div>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium">
                            Sign Out
                        </button>
                    </form>
                @else
                    <a href="{{ route('login') }}" class="px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg">Sign In</a>
                    <a href="{{ route('register') }}" class="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800">Register</a>
                @endauth
            </div>
        </div>
    </header>

    <!-- Main Content Slot -->
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        @if(session('error'))
            <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
                {{ session('error') }}
            </div>
        @endif
        @if(session('success'))
            <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                {{ session('success') }}
            </div>
        @endif

        @yield('content')
    </main>

    <!-- Discrete Hidden Staff Footer -->
    <footer class="border-t border-stone-200 bg-white py-4 text-xs text-stone-500">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <div>Laravel 11.x &middot; MySQL Spatial (ST_Distance_Sphere) &middot; Laravel Reverb WebSockets</div>
            <a href="{{ route('admin.login') }}" class="font-mono text-stone-400 hover:text-stone-700">Staff Gateway</a>
        </div>
    </footer>
</body>
</html>
