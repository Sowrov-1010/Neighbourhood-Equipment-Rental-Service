-- ==============================================================================
-- NEIGHBORHOOD EQUIPMENT SHARING & TOOL DIRECTORY
-- PostgreSQL 15+ with PostGIS Extension Schema
-- Compatible with Laravel 11.x Eloquent ORM & ST_Distance Geodesic Calculations
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS rental_requests CASCADE;
DROP TABLE IF EXISTS broadcasts CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    neighborhood VARCHAR(100) NOT NULL DEFAULT 'Hamlet Tower',
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    rating_count INTEGER NOT NULL DEFAULT 0,
    total_lent INTEGER NOT NULL DEFAULT 0,
    total_borrowed INTEGER NOT NULL DEFAULT 0,
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    blacklist_reason VARCHAR(255) NULL,
    blacklisted_at TIMESTAMP NULL,
    latitude NUMERIC(10,7) NULL,
    longitude NUMERIC(10,7) NULL,
    geom geometry(Point, 4326) NULL,
    admin_security_hash VARCHAR(255) NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_blacklist_idx ON users(is_blacklisted);
CREATE INDEX users_geom_gidx ON users USING GIST (geom);

CREATE TABLE tools (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    category VARCHAR(60) NOT NULL,
    pricing_type VARCHAR(30) NOT NULL DEFAULT 'free_community',
    daily_rate NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    hourly_rate NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    condition VARCHAR(30) NOT NULL DEFAULT 'good',
    brand VARCHAR(80) NULL,
    model_number VARCHAR(100) NULL,
    photo_urls JSONB NULL,
    primary_photo_url VARCHAR(500) NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    requires_admin_review BOOLEAN NOT NULL DEFAULT FALSE,
    neighborhood VARCHAR(100) NOT NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    geom geometry(Point, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX tools_category_idx ON tools(category);
CREATE INDEX tools_geom_gidx ON tools USING GIST (geom);

CREATE TABLE rental_requests (
    id BIGSERIAL PRIMARY KEY,
    tool_id BIGINT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    borrower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'requested',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    deposit_held NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    pickup_pin_hash VARCHAR(255) NULL,
    return_pin_hash VARCHAR(255) NULL,
    handover_confirmed_at TIMESTAMP NULL,
    return_confirmed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    overdue_hours INTEGER NOT NULL DEFAULT 0,
    borrower_rating SMALLINT NULL,
    borrower_review TEXT NULL,
    lender_rating SMALLINT NULL,
    lender_review TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX rental_borrower_idx ON rental_requests(borrower_id, status);
CREATE INDEX rental_lender_idx ON rental_requests(lender_id, status);
CREATE INDEX rental_status_idx ON rental_requests(status);

CREATE TABLE disputes (
    id BIGSERIAL PRIMARY KEY,
    rental_request_id BIGINT NOT NULL REFERENCES rental_requests(id) ON DELETE CASCADE,
    filed_by_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    against_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    evidence_photos JSONB NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    claimed_amount NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    awarded_amount NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    resolved_by_admin_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NULL,
    target_id BIGINT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
