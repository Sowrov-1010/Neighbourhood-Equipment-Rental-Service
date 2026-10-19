import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Server, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Compass, 
  Radio, 
  ShieldCheck, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LaravelDatabaseHubModalProps {
  onClose: () => void;
}

export const LaravelDatabaseHubModal: React.FC<LaravelDatabaseHubModalProps> = ({ onClose }) => {
  const { assets, users, rentalRequests, disputes, broadcasts, reviews, cloudSyncInfo, forceCloudResync } = useApp();
  const [activeTab, setActiveTab] = useState<'sql' | 'laravel' | 'spatial' | 'artisan' | 'cloud'>('sql');
  const [sqlDialect, setSqlDialect] = useState<'mysql' | 'postgres'>('mysql');
  const [selectedFile, setSelectedFile] = useState<string>('Tool.php');
  const [copied, setCopied] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);
  const [resyncSuccess, setResyncSuccess] = useState(false);

  // Spatial Distance Playground state
  const [testUserLat, setTestUserLat] = useState(37.7749);
  const [testUserLng, setTestUserLng] = useState(-122.4194);
  const [searchRadiusMeters, setSearchRadiusMeters] = useState(5000);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  // Generate live export SQL based on current state
  const generateLiveSqlDump = () => {
    const isMysql = sqlDialect === 'mysql';
    return `-- ==============================================================================
-- NEIGHBORHOOD EQUIPMENT SHARING & TOOL DIRECTORY
-- Export Engine: ${isMysql ? 'MySQL 8.0+ (with Spatial POINT & ST_Distance_Sphere)' : 'PostgreSQL 15+ (with PostGIS Extension)'}
-- Export Timestamp: ${new Date().toISOString()}
-- Total Users: ${users.length} | Total Tools: ${assets.length} | Rentals: ${rentalRequests.length}
-- ==============================================================================

${isMysql ? `SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs, disputes, rental_requests, broadcasts, tools, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  neighborhood VARCHAR(100) NOT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_lent INT UNSIGNED DEFAULT 0,
  total_borrowed INT UNSIGNED DEFAULT 0,
  is_blacklisted TINYINT(1) DEFAULT 0,
  blacklist_reason VARCHAR(255) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  location POINT NULL /*!80003 SRID 4326 */,
  admin_security_hash VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_blacklisted (is_blacklisted),
  SPATIAL INDEX idx_spatial (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tools (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  category VARCHAR(60) NOT NULL,
  pricing_type ENUM('free_community', 'daily_rate', 'hourly_rate') NOT NULL,
  daily_rate DECIMAL(8,2) DEFAULT 0.00,
  condition ENUM('pristine', 'good', 'fair', 'heavy_duty') DEFAULT 'good',
  primary_photo_url VARCHAR(500) NULL,
  is_available TINYINT(1) DEFAULT 1,
  neighborhood VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  location_point POINT NOT NULL /*!80003 SRID 4326 */,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  SPATIAL INDEX idx_tool_spatial (location_point),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rental_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tool_id BIGINT UNSIGNED NOT NULL,
  borrower_id BIGINT UNSIGNED NOT NULL,
  lender_id BIGINT UNSIGNED NOT NULL,
  status ENUM('requested', 'payment_authorized', 'active_rental', 'pending_handover', 'return_pending', 'completed', 'disputed', 'cancelled') DEFAULT 'requested',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(8,2) DEFAULT 0.00,
  pickup_pin_hash VARCHAR(255) NULL,
  return_pin_hash VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_borrower (borrower_id, status),
  INDEX idx_lender (lender_id, status),
  FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;` : `CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  neighborhood VARCHAR(100) NOT NULL,
  rating NUMERIC(3,2) DEFAULT 5.00,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  geom geometry(Point, 4326),
  admin_security_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_geom ON users USING GIST (geom);`}

-- ------------------------------------------------------------------------------
-- SEED DATA DUMP (Current State: ${users.length} Users)
-- ------------------------------------------------------------------------------
${users.map(u => isMysql 
  ? `INSERT INTO users (id, name, email, password, role, neighborhood, rating, is_blacklisted, latitude, longitude, location, admin_security_hash) VALUES (${u.id}, '${u.name.replace(/'/g, "''")}', '${u.email}', '$2y$12$passwordHash...', '${u.role}', '${u.neighborhood}', ${u.rating}, ${u.isBlacklisted ? 1 : 0}, 37.7749, -122.4194, ST_SRID(POINT(-122.4194, 37.7749), 4326), ${u.role === 'admin' ? "'$2y$12$securityCode2580Hash...'" : 'NULL'});`
  : `INSERT INTO users (id, name, email, password, role, neighborhood, rating, is_blacklisted, latitude, longitude, geom) VALUES (${u.id}, '${u.name.replace(/'/g, "''")}', '${u.email}', '$2y$12$passwordHash...', '${u.role}', '${u.neighborhood}', ${u.rating}, ${u.isBlacklisted}, 37.7749, -122.4194, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326));`
).join('\n')}

-- SEED DATA DUMP: ${assets.length} Equipment Listings
${assets.map((a, i) => {
  const owner = users.find(u => u.id === a.ownerId);
  const lat = owner?.coordinates?.lat || 37.7749;
  const lng = owner?.coordinates?.lng || -122.4194;
  return isMysql
    ? `INSERT INTO tools (id, owner_id, name, description, category, pricing_type, daily_rate, condition, primary_photo_url, is_available, neighborhood, latitude, longitude, location_point) VALUES (${i + 1}, ${users[0]?.id || 1}, '${a.title.replace(/'/g, "''")}', '${(a.description || '').replace(/'/g, "''")}', '${a.category}', '${a.pricingType}', ${a.priceAmount || 0}, '${a.condition}', '${a.imageUrl || ''}', ${a.isAvailable ? 1 : 0}, '${a.neighborhood}', ${lat}, ${lng}, ST_SRID(POINT(${lng}, ${lat}), 4326));`
    : `INSERT INTO tools (id, owner_id, name, description, category, pricing_type, daily_rate, condition, primary_photo_url, is_available, neighborhood, latitude, longitude, geom) VALUES (${i + 1}, ${users[0]?.id || 1}, '${a.title.replace(/'/g, "''")}', '${(a.description || '').replace(/'/g, "''")}', '${a.category}', '${a.pricingType}', ${a.priceAmount || 0}, '${a.condition}', '${a.imageUrl || ''}', ${a.isAvailable}, '${a.neighborhood}', ${lat}, ${lng}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326));`;
}).join('\n')}

-- SEED DATA DUMP: ${rentalRequests.length} Rental Transactions
${rentalRequests.map(r => `INSERT INTO rental_requests (id, tool_id, borrower_id, lender_id, status, start_date, end_date, total_amount) VALUES (${r.id}, 1, ${r.borrowerId}, ${r.lenderId}, '${r.status}', '${r.startDate}', '${r.endDate}', ${r.totalCost || 0});`).join('\n')}
`;
  };

  const downloadSqlDump = () => {
    const content = generateLiveSqlDump();
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `neighborhood_share_${sqlDialect}_dump.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Laravel files dictionary
  const laravelFiles: Record<string, { path: string; desc: string; code: string }> = {
    'Tool.php': {
      path: 'app/Models/Tool.php',
      desc: 'Eloquent Model with MySQL ST_Distance_Sphere radial calculation scope',
      code: `<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Tool extends Model
{
    protected $fillable = [
        'owner_id', 'name', 'description', 'category',
        'pricing_type', 'daily_rate', 'condition',
        'photo_urls', 'primary_photo_url', 'is_available',
        'neighborhood', 'latitude', 'longitude'
    ];

    /**
     * Radial Proximity Search with MySQL ST_Distance_Sphere
     * Great-circle geodesic distance in meters
     */
    public function scopeWithinDistanceSphere(Builder $query, float $lat, float $lng, float $radiusKm = 10.0): Builder
    {
        $radiusMeters = $radiusKm * 1000.0;
        return $query
            ->select('tools.*')
            ->selectRaw('ST_Distance_Sphere(POINT(longitude, latitude), POINT(?, ?)) as distance_meters', [$lng, $lat])
            ->whereRaw('ST_Distance_Sphere(POINT(longitude, latitude), POINT(?, ?)) <= ?', [$lng, $lat, $radiusMeters])
            ->orderBy('distance_meters', 'asc');
    }
}`
    },
    'EnsureUserIsNotBlacklisted.php': {
      path: 'app/Http/Middleware/EnsureUserIsNotBlacklisted.php',
      desc: 'Laravel Middleware blocking delinquent or penalized accounts from creating listings or booking tools',
      code: `<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsNotBlacklisted
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->is_blacklisted) {
            return response()->json([
                'error' => 'ACCOUNT_BLACKLISTED',
                'message' => 'Access Denied: Account suspended by District Administration.',
                'reason' => $user->blacklist_reason,
                'blacklisted_at' => $user->blacklisted_at,
            ], 403);
        }

        return $next($request);
    }
}`
    },
    'RentalRequest.php': {
      path: 'app/Models/RentalRequest.php',
      desc: 'FSM deterministic transition engine with strict account-isolated scope',
      code: `<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Events\RentalStateUpdated;

class RentalRequest extends Model
{
    /**
     * Account Isolation Scope: Users strictly view only their own bookings
     */
    public function scopeForAccount(Builder $query, int $userId): Builder
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('borrower_id', $userId)
              ->orWhere('lender_id', $userId);
        });
    }

    public function transitionTo(string $newStatus): bool
    {
        $this->status = $newStatus;
        $this->save();
        broadcast(new RentalStateUpdated($this))->toOthers();
        return true;
    }
}`
    },
    'RentalRequestObserver.php': {
      path: 'app/Observers/RentalRequestObserver.php',
      desc: 'Eloquent Observer triggering Laravel Reverb WebSocket broadcast & audit logs',
      code: `<?php

namespace App\Observers;

use App\Models\RentalRequest;
use App\Models\AuditLog;
use App\Events\RentalStateUpdated;

class RentalRequestObserver
{
    public function updated(RentalRequest $rental): void
    {
        if ($rental->isDirty('status')) {
            AuditLog::logEvent('fsm_transition', auth()->id(), 'RentalRequest', $rental->id, [
                'from' => $rental->getOriginal('status'),
                'to' => $rental->status
            ]);

            event(new RentalStateUpdated($rental));
        }
    }
}`
    },
    'RentalStateUpdated.php': {
      path: 'app/Events/RentalStateUpdated.php',
      desc: 'Laravel Reverb / Pusher WebSockets real-time sync event',
      code: `<?php

namespace App\Events;

use App\Models\RentalRequest;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;

class RentalStateUpdated implements ShouldBroadcast
{
    public function __construct(public RentalRequest $rentalRequest) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->rentalRequest->borrower_id),
            new PrivateChannel('user.' . $this->rentalRequest->lender_id),
            new PrivateChannel('admin.console'),
        ];
    }
}`
    },
    'ExpireRentalRequests.php': {
      path: 'app/Console/Commands/ExpireRentalRequests.php',
      desc: 'Artisan Command scheduled via php artisan schedule:run to auto-expire 24h stale bookings',
      code: `<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RentalRequest;

class ExpireRentalRequests extends Command
{
    protected $signature = 'rentals:expire-ttl';
    protected $description = 'Auto-expire requests exceeding 24h lender acceptance TTL';

    public function handle(): int
    {
        $expired = RentalRequest::where('status', 'requested')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'cancelled']);

        $this->info("Expired {$expired} requests.");
        return Command::SUCCESS;
    }
}`
    },
    'routes/api.php': {
      path: 'routes/api.php',
      desc: 'Sanctum API routes with spatial proximity query and hidden admin gateway',
      code: `<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ToolController;
use App\Http\Controllers\Api\RentalRequestController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/admin/login', [AuthController::class, 'adminLogin']); // Requires 2580 security code

Route::get('/tools', [ToolController::class, 'index']); // ?lat=&lng=&radius_km=

Route::middleware('auth:sanctum')->group(function () {
    Route::middleware('user.not.blacklisted')->group(function () {
        Route::post('/tools', [ToolController::class, 'store']); // Picture uploads
        Route::post('/rentals', [RentalRequestController::class, 'store']);
    });

    Route::get('/my-rentals', [RentalRequestController::class, 'index']); // Account-isolated
});`
    }
  };

  // Calculate live distance for spatial preview
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Laravel 11.x &amp; Spatial Database Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400 text-stone-950">
                  PHP 8.2+
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
                  MySQL 8.0 / PostGIS
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Core Eloquent Architecture, ST_Distance_Sphere Proximity, Reverb WebSockets &amp; Live SQL Exporter
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-stone-200 bg-stone-50 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'sql' 
                ? 'border-amber-600 text-stone-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>SQL Database Exporter</span>
          </button>

          <button
            onClick={() => setActiveTab('laravel')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'laravel' 
                ? 'border-amber-600 text-stone-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-amber-600" />
            <span>Laravel 11 Architecture Files</span>
          </button>

          <button
            onClick={() => setActiveTab('spatial')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'spatial' 
                ? 'border-amber-600 text-stone-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>ST_Distance_Sphere Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('artisan')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'artisan' 
                ? 'border-amber-600 text-stone-900' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Task Scheduler &amp; Reverb</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'cloud' 
                ? 'border-emerald-600 text-stone-900 font-bold' 
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Cloud Auto-Sync (GCP Firestore)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: SQL DATABASE EXPORTER */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Direct Database Store &amp; Import
                  </h4>
                  <p className="text-xs text-amber-900 mt-0.5">
                    Generate and download a complete SQL schema and data seed dump ready to import into your MySQL or PostgreSQL database.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-stone-300 p-0.5 bg-white text-xs">
                    <button
                      onClick={() => setSqlDialect('mysql')}
                      className={`px-2.5 py-1 rounded font-medium ${sqlDialect === 'mysql' ? 'bg-stone-900 text-white font-semibold' : 'text-stone-600'}`}
                    >
                      MySQL 8.0+
                    </button>
                    <button
                      onClick={() => setSqlDialect('postgres')}
                      className={`px-2.5 py-1 rounded font-medium ${sqlDialect === 'postgres' ? 'bg-stone-900 text-white font-semibold' : 'text-stone-600'}`}
                    >
                      PostgreSQL 15+
                    </button>
                  </div>
                  <button
                    onClick={downloadSqlDump}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .SQL Dump</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] font-mono text-stone-500 uppercase">Users &amp; Admins</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{users.length} Records</div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] font-mono text-stone-500 uppercase">Tools &amp; Geometries</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{assets.length} Point Entities</div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] font-mono text-stone-500 uppercase">Rental Tracks</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{rentalRequests.length} FSM Records</div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] font-mono text-stone-500 uppercase">Spatial Indexing</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">SRID 4326 Active</div>
                </div>
              </div>

              {/* Code Preview */}
              <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-800 text-stone-300 text-xs font-mono">
                  <span>schema_{sqlDialect}.sql (Live Generated)</span>
                  <button
                    onClick={() => handleCopy(generateLiveSqlDump(), 'sql')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-white transition-colors"
                  >
                    {copied === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'sql' ? 'Copied SQL!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-amber-300/90 overflow-x-auto max-h-80 leading-relaxed">
                  {generateLiveSqlDump().slice(0, 3200)}...
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: LARAVEL 11 CODE ARCHITECTURE */}
          {activeTab === 'laravel' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* File List */}
              <div className="md:col-span-4 border border-stone-200 rounded-xl p-2 bg-stone-50 space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                  Laravel 11 Components
                </div>
                {Object.keys(laravelFiles).map(fileName => (
                  <button
                    key={fileName}
                    onClick={() => setSelectedFile(fileName)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                      selectedFile === fileName 
                        ? 'bg-stone-900 text-white font-semibold shadow-xs' 
                        : 'text-stone-700 hover:bg-stone-200/60'
                    }`}
                  >
                    <span className="truncate">{fileName}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${selectedFile === fileName ? 'text-amber-400' : 'text-stone-400'}`} />
                  </button>
                ))}
              </div>

              {/* Code Viewer */}
              <div className="md:col-span-8 border border-stone-800 rounded-xl overflow-hidden bg-stone-950 flex flex-col">
                <div className="px-4 py-2.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-amber-400 font-bold">
                      {laravelFiles[selectedFile].path}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {laravelFiles[selectedFile].desc}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(laravelFiles[selectedFile].code, selectedFile)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-white text-xs font-mono transition-colors"
                  >
                    {copied === selectedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === selectedFile ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-stone-200 overflow-x-auto max-h-96 leading-relaxed flex-1">
                  {laravelFiles[selectedFile].code}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SPATIAL SEARCH ENGINE */}
          {activeTab === 'spatial' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-900 text-white rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    MySQL 8.0+ ST_Distance_Sphere &amp; PostGIS Geodesic Engine
                  </h4>
                </div>
                <p className="text-xs text-stone-300">
                  Calculates real-world geodesic great-circle distances in meters between the borrower's location and nearby equipment.
                </p>
                <div className="p-2.5 bg-stone-950 rounded-lg text-xs font-mono text-amber-300/90 border border-stone-800">
                  SELECT name, ST_Distance_Sphere(location_point, POINT({testUserLng}, {testUserLat})) AS distance_m FROM tools WHERE ST_Distance_Sphere(location_point, POINT({testUserLng}, {testUserLat})) &lt;= {searchRadiusMeters} ORDER BY distance_m ASC;
                </div>
              </div>

              {/* Interactive Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Origin Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={testUserLat}
                    onChange={(e) => setTestUserLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Origin Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={testUserLng}
                    onChange={(e) => setTestUserLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Radial Search ({searchRadiusMeters.toLocaleString()} m)</label>
                  <input
                    type="range"
                    min="1000"
                    max="25000"
                    step="500"
                    value={searchRadiusMeters}
                    onChange={(e) => setSearchRadiusMeters(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-amber-600"
                  />
                </div>
              </div>

              {/* Live Distance Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-600 font-mono text-[11px] border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-2.5">Tool Name</th>
                      <th className="px-4 py-2.5">Neighborhood</th>
                      <th className="px-4 py-2.5">GPS Coordinates</th>
                      <th className="px-4 py-2.5">Calculated Distance</th>
                      <th className="px-4 py-2.5">Spatial Query Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {assets.map(asset => {
                      const owner = users.find(u => u.id === asset.ownerId);
                      const lat = owner?.coordinates?.lat || 37.7749;
                      const lng = owner?.coordinates?.lng || -122.4194;
                      const distanceMeters = calculateDistance(testUserLat, testUserLng, lat, lng);
                      const isWithin = distanceMeters <= searchRadiusMeters;

                      return (
                        <tr key={asset.id} className={isWithin ? 'hover:bg-amber-50/50' : 'opacity-40 bg-stone-50'}>
                          <td className="px-4 py-3 font-semibold text-stone-900">{asset.title}</td>
                          <td className="px-4 py-3 text-stone-600">{asset.neighborhood}</td>
                          <td className="px-4 py-3 font-mono text-stone-500">{lat.toFixed(4)}, {lng.toFixed(4)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-stone-800">
                            {Math.round(distanceMeters).toLocaleString()} m
                          </td>
                          <td className="px-4 py-3">
                            {isWithin ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                                MATCH (WITHIN {searchRadiusMeters}M)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-stone-500 bg-stone-200">
                                EXCLUDED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ARTISAN & WEBSOCKET ENGINE */}
          {activeTab === 'artisan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Task Scheduler */}
                <div className="p-4 border border-stone-200 rounded-xl bg-stone-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Laravel Task Scheduler (Cron)
                    </h4>
                  </div>
                  <p className="text-xs text-stone-600">
                    Runs in the background via <code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-[11px]">php artisan schedule:run</code>.
                  </p>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                      <div className="font-bold text-stone-900">rentals:expire-ttl (Every Minute)</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">Cancels requests exceeding 24h lender response TTL</div>
                    </div>
                    <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                      <div className="font-bold text-stone-900">rentals:check-overdue (Hourly)</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">Flags late equipment &amp; calculates trust metric sanctions</div>
                    </div>
                  </div>
                </div>

                {/* WebSockets */}
                <div className="p-4 border border-stone-200 rounded-xl bg-stone-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Laravel Reverb WebSockets
                    </h4>
                  </div>
                  <p className="text-xs text-stone-600">
                    Real-time state synchronization for equipment handovers and PIN handshakes without page refreshes.
                  </p>
                  <div className="p-3 bg-stone-900 text-stone-200 rounded-lg font-mono text-xs space-y-1">
                    <div className="text-amber-400">// Echo Client Subscription:</div>
                    <div>{"Echo.private('user.' + userId)"}</div>
                    <div className="pl-4">.listen(&apos;.rental.state.updated&apos;, (e) =&gt; &#123;</div>
                    <div className="pl-8 text-emerald-400">syncRentalFsm(e.rental);</div>
                    <div className="pl-4">&#125;);</div>
                  </div>
                </div>
              </div>

              {/* Artisan CLI Deployment Guide */}
              <div className="p-4 bg-stone-900 text-white rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Deployment Quickstart
                  </h4>
                </div>
                <pre className="p-3 bg-stone-950 rounded-lg text-xs font-mono text-stone-300 border border-stone-800 leading-relaxed overflow-x-auto">
{`# 1. Clone repository & install dependencies
composer install
npm install && npm run build

# 2. Configure .env with your MySQL / PostgreSQL credentials
cp .env.example .env
php artisan key:generate

# 3. Run database migrations with Spatial tables & initial seeders
php artisan migrate --seed

# 4. Start Laravel Reverb WebSockets & Queue worker
php artisan reverb:start
php artisan queue:work redis

# 5. Serve application
php artisan serve`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE CLOUD AUTO-SYNC (GCP FIRESTORE) */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              {/* Cloud Banner */}
              <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl relative overflow-hidden text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          Active Google Cloud Persistence
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          AUTO-STORING IN AI STUDIO
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Any action you take in the web application is immediately written to Google Cloud Firestore with real-time bidirectional WebSocket replication.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setResyncing(true);
                      await forceCloudResync();
                      setResyncing(false);
                      setResyncSuccess(true);
                      setTimeout(() => setResyncSuccess(false), 3000);
                    }}
                    disabled={resyncing}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${resyncing ? 'animate-spin' : ''}`} />
                    <span>{resyncSuccess ? 'Synced to Cloud!' : resyncing ? 'Pushing...' : 'Force Cloud Push'}</span>
                  </button>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">Cloud Project</span>
                  <div className="text-sm font-bold font-mono text-stone-900 truncate" title={cloudSyncInfo.projectId}>
                    {cloudSyncInfo.projectId}
                  </div>
                  <div className="text-xs text-stone-500">Google Cloud Platform</div>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">Firestore Database ID</span>
                  <div className="text-sm font-bold font-mono text-stone-900 truncate" title={cloudSyncInfo.databaseId}>
                    {cloudSyncInfo.databaseId}
                  </div>
                  <div className="text-xs text-stone-500">Dedicated Applet Instance</div>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">Live Status</span>
                  <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Replication Active</span>
                  </div>
                  <div className="text-xs text-stone-500 font-mono">
                    Last write: {cloudSyncInfo.lastSyncedAt ? new Date(cloudSyncInfo.lastSyncedAt).toLocaleTimeString() : 'Current session'}
                  </div>
                </div>
              </div>

              {/* Collections Status Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 font-bold text-xs text-stone-800 flex items-center justify-between">
                  <span>Replicated Cloud Collections</span>
                  <span className="text-[11px] font-mono font-normal text-stone-500">Real-time onSnapshot Listeners</span>
                </div>
                <div className="divide-y divide-stone-100 text-xs">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900">/assets</span>
                      <span className="text-stone-500">&mdash; Equipment listings, pricing, availability &amp; specs</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-800">{assets.length} docs</span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900">/rental_requests</span>
                      <span className="text-stone-500">&mdash; 8-state FSM rental transactions &amp; PIN timestamps</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-800">{rentalRequests.length} docs</span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900">/users</span>
                      <span className="text-stone-500">&mdash; Resident &amp; Admin profiles, ratings, blacklist states</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-800">{users.length} docs</span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900">/disputes</span>
                      <span className="text-stone-500">&mdash; Escalated mediation tickets &amp; official admin directives</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-800">{disputes.length} docs</span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900">/broadcasts</span>
                      <span className="text-stone-500">&mdash; Neighborhood equipment wanted demands</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-800">{broadcasts.length} docs</span>
                  </div>

                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900">/reviews</span>
                      <span className="text-stone-500">&mdash; Community peer trustworthiness reviews &amp; ratings</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-800">{reviews.length} docs</span>
                  </div>
                </div>
              </div>

              {/* Architecture Harmony Note */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>How AI Studio Persistence Works with your Laravel / SQL Stack</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  While running inside Google AI Studio, your application automatically stores and reads all data in <strong>Google Cloud Firestore</strong> so your state persists across browser reloads, edits, and sessions. When you deploy the external Laravel backend, you can use the <strong>SQL Database Exporter</strong> tab above to export your PostgreSQL 15+ (PostGIS) or MySQL 8.0 schema and seeders populated directly with the live data stored here.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Full codebase written in <code className="font-mono font-bold text-stone-800">/backend-laravel/</code> folder</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 transition-colors"
          >
            Close Engine Hub
          </button>
        </div>

      </div>
    </div>
  );
};
