-- ============================================
-- TALAEN FARM MANAGEMENT SYSTEM
-- Complete Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Authentication)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('farm_owner', 'supervisor', 'tea_worker', 'dairy_worker', 'store_manager', 'milk_buyer')),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. TEA WORKERS TABLE
-- ============================================
CREATE TABLE tea_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    total_debt DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. COMPANIES TABLE (Tea Buyers)
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    buying_rate DECIMAL(10,2) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. BLOCKS TABLE (Farm Sections)
-- ============================================
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. WAGE RATE TABLE
-- ============================================
CREATE TABLE wage_rate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_per_kg DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. PLUCKING SELF TABLE (Worker Records)
-- ============================================
CREATE TABLE plucking_self (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES tea_workers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
    plucking_date DATE NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    field_grade VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. PLUCKING VERIFIED TABLE (Owner Records)
-- ============================================
CREATE TABLE plucking_verified (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES tea_workers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
    plucking_date DATE NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    field_grade VARCHAR(50),
    is_settled BOOLEAN DEFAULT false,
    settlement_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. DEBTS TABLE (Store Debts)
-- ============================================
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES tea_workers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    debt_date DATE NOT NULL,
    description TEXT,
    is_settled BOOLEAN DEFAULT false,
    settlement_id UUID,
    is_reversed BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. DEBT REVERSALS TABLE (Audit Trail)
-- ============================================
CREATE TABLE debt_reversals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
    reversal_amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    reversed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. SETTLEMENTS TABLE (Payment Records)
-- ============================================
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES tea_workers(id) ON DELETE CASCADE,
    settlement_date DATE NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL,
    total_debt DECIMAL(10,2) DEFAULT 0.00,
    net_pay DECIMAL(10,2) NOT NULL,
    kg_settled DECIMAL(10,2) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 11. COWS TABLE
-- ============================================
CREATE TABLE cows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_number VARCHAR(50) UNIQUE NOT NULL,
    breed VARCHAR(100),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 12. DAIRY WORKERS TABLE
-- ============================================
CREATE TABLE dairy_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    monthly_salary DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 13. MILK BUYERS TABLE
-- ============================================
CREATE TABLE milk_buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 14. MILK PRODUCTION TABLE
-- ============================================
CREATE TABLE milk_production (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES dairy_workers(id) ON DELETE CASCADE,
    production_date DATE NOT NULL,
    morning_litres DECIMAL(10,2) DEFAULT 0.00,
    evening_litres DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 15. MILK DISPOSAL TABLE
-- ============================================
CREATE TABLE milk_disposal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disposal_date DATE NOT NULL,
    disposal_type VARCHAR(20) NOT NULL CHECK (disposal_type IN ('sale', 'home_use', 'other')),
    buyer_id UUID REFERENCES milk_buyers(id),
    litres DECIMAL(10,2) NOT NULL,
    price_per_litre DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 16. FEED TABLE
-- ============================================
CREATE TABLE feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES dairy_workers(id) ON DELETE CASCADE,
    feed_date DATE NOT NULL,
    feed_type VARCHAR(100) NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17. DAIRY PAYMENTS TABLE
-- ============================================
CREATE TABLE dairy_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES dairy_workers(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_period VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 18. BUYER DELIVERIES TABLE
-- ============================================
CREATE TABLE buyer_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES milk_buyers(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    litres_assigned DECIMAL(10,2) NOT NULL,
    litres_confirmed DECIMAL(10,2),
    price_per_litre DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    is_confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 19. BUYER PAYMENTS TABLE
-- ============================================
CREATE TABLE buyer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES milk_buyers(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period_covered VARCHAR(100),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_tea_workers_user ON tea_workers(user_id);
CREATE INDEX idx_plucking_self_worker ON plucking_self(worker_id);
CREATE INDEX idx_plucking_self_date ON plucking_self(plucking_date);
CREATE INDEX idx_plucking_verified_worker ON plucking_verified(worker_id);
CREATE INDEX idx_plucking_verified_date ON plucking_verified(plucking_date);
CREATE INDEX idx_plucking_verified_settled ON plucking_verified(is_settled);
CREATE INDEX idx_debts_worker ON debts(worker_id);
CREATE INDEX idx_debts_settled ON debts(is_settled);
CREATE INDEX idx_milk_production_date ON milk_production(production_date);
CREATE INDEX idx_milk_production_cow ON milk_production(cow_id);
CREATE INDEX idx_buyer_deliveries_buyer ON buyer_deliveries(buyer_id);
CREATE INDEX idx_dairy_workers_user ON dairy_workers(user_id);
CREATE INDEX idx_milk_buyers_user ON milk_buyers(user_id);
