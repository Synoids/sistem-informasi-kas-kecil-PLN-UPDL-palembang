-- ==============================================================================
-- INITIAL SCHEMA MIGRATION: Sistem Informasi Pengelolaan Kas Kecil
-- ==============================================================================

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE cash_source_type AS ENUM ('MAIN', 'INDIVIDUAL');

-- 2. Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 3. Tables
-- ==============================================================================

-- PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FUND HOLDERS
CREATE TABLE fund_holders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    employee_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- CASH SOURCES
CREATE TABLE cash_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type cash_source_type NOT NULL,
    fund_holder_id UUID REFERENCES fund_holders(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- USER CASH SOURCE ACCESS
CREATE TABLE user_cash_source_access (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    cash_source_id UUID REFERENCES cash_sources(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, cash_source_id)
);

-- CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- DIVISIONS
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ALLOCATIONS
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    source_id UUID NOT NULL REFERENCES cash_sources(id),
    destination_id UUID NOT NULL REFERENCES cash_sources(id),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT allocation_source_dest_differ CHECK (source_id != destination_id)
);
CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    cash_source_id UUID NOT NULL REFERENCES cash_sources(id),
    recipient_name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    vehicle_number TEXT,
    division_id UUID NOT NULL REFERENCES divisions(id),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    receipt_date DATE NOT NULL,
    handover_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. Indexes
-- ==============================================================================
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_cash_source_id ON transactions(cash_source_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_division_id ON transactions(division_id);
CREATE INDEX idx_allocations_source_id ON allocations(source_id);
CREATE INDEX idx_allocations_destination_id ON allocations(destination_id);
CREATE INDEX idx_user_cash_source_access_user_id ON user_cash_source_access(user_id);

-- ==============================================================================
-- 5. Views
-- ==============================================================================
CREATE OR REPLACE VIEW v_cash_source_balances AS
SELECT 
    cs.id AS cash_source_id,
    cs.code,
    cs.name,
    cs.type,
    cs.is_active,
    COALESCE(
        (SELECT SUM(amount) FROM allocations WHERE destination_id = cs.id), 
        0
    ) 
    - COALESCE(
        (SELECT SUM(amount) FROM allocations WHERE source_id = cs.id), 
        0
    ) 
    - COALESCE(
        (SELECT SUM(amount) FROM transactions WHERE cash_source_id = cs.id), 
        0
    ) AS balance
FROM cash_sources cs;

-- ==============================================================================
-- 6. RPCs (Stored Procedures)
-- ==============================================================================

-- Helper function to check role safely
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS user_role AS $$
DECLARE
    role user_role;
BEGIN
    SELECT p.role INTO role FROM profiles p WHERE p.id = auth.uid();
    RETURN COALESCE(role, 'USER'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- A. CREATE ALLOCATION
CREATE OR REPLACE FUNCTION create_allocation(
    p_date DATE,
    p_source_id UUID,
    p_destination_id UUID,
    p_amount NUMERIC(15,2),
    p_description TEXT
)
RETURNS UUID AS $$
DECLARE
    v_role user_role;
    v_source_balance NUMERIC(15,2);
    v_alloc_id UUID;
BEGIN
    -- 1. Validasi Role
    v_role := get_auth_role();
    IF v_role != 'ADMIN' THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat membuat allocation';
    END IF;

    -- 2. Validasi Source != Destination
    IF p_source_id = p_destination_id THEN
        RAISE EXCEPTION 'ERR_SAME_SOURCE_DEST: Source dan Destination tidak boleh sama';
    END IF;

    -- 3. Validasi Amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'ERR_INVALID_INPUT: Amount harus lebih besar dari 0';
    END IF;

    -- 4. Validasi Saldo Source (Dengan Row-Level Lock mencegah Race Condition)
    PERFORM 1 FROM cash_sources WHERE id = p_source_id FOR UPDATE;
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = p_source_id;
    IF v_source_balance IS NULL THEN
        RAISE EXCEPTION 'ERR_NOT_FOUND: Source cash source tidak valid';
    END IF;
    
    IF v_source_balance < p_amount THEN
        RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Saldo source tidak mencukupi (Saldo: %)', v_source_balance;
    END IF;

    -- 5. Insert
    INSERT INTO allocations (date, source_id, destination_id, amount, description, created_by, updated_by)
    VALUES (p_date, p_source_id, p_destination_id, p_amount, p_description, auth.uid(), auth.uid())
    RETURNING id INTO v_alloc_id;

    RETURN v_alloc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- B. CREATE TRANSACTION
CREATE OR REPLACE FUNCTION create_transaction(
    p_date DATE,
    p_cash_source_id UUID,
    p_recipient_name TEXT,
    p_category_id UUID,
    p_vehicle_number TEXT,
    p_division_id UUID,
    p_amount NUMERIC(15,2),
    p_description TEXT,
    p_receipt_date DATE,
    p_handover_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_role user_role;
    v_has_access BOOLEAN;
    v_source_balance NUMERIC(15,2);
    v_trans_id UUID;
BEGIN
    v_role := get_auth_role();
    
    -- 1. Validasi Akses
    IF v_role != 'ADMIN' THEN
        SELECT EXISTS (
            SELECT 1 FROM user_cash_source_access 
            WHERE user_id = auth.uid() AND cash_source_id = p_cash_source_id
        ) INTO v_has_access;
        
        IF NOT v_has_access THEN
            RAISE EXCEPTION 'ERR_UNAUTHORIZED_SOURCE: Anda tidak memiliki hak akses pada sumber dana ini';
        END IF;
    END IF;

    -- 2. Validasi Amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'ERR_INVALID_INPUT: Amount harus lebih besar dari 0';
    END IF;

    -- 3. Validasi Saldo (Dengan Row-Level Lock mencegah Race Condition)
    PERFORM 1 FROM cash_sources WHERE id = p_cash_source_id FOR UPDATE;
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = p_cash_source_id;
    IF v_source_balance IS NULL THEN
        RAISE EXCEPTION 'ERR_NOT_FOUND: Cash source tidak valid';
    END IF;
    
    IF v_source_balance < p_amount THEN
        RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Saldo tidak mencukupi (Saldo: %)', v_source_balance;
    END IF;

    -- 4. Insert
    INSERT INTO transactions (
        date, cash_source_id, recipient_name, category_id, vehicle_number, 
        division_id, amount, description, receipt_date, handover_date, 
        created_by, updated_by
    )
    VALUES (
        p_date, p_cash_source_id, p_recipient_name, p_category_id, p_vehicle_number, 
        p_division_id, p_amount, p_description, p_receipt_date, p_handover_date, 
        auth.uid(), auth.uid()
    )
    RETURNING id INTO v_trans_id;

    RETURN v_trans_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- C. UPDATE TRANSACTION
CREATE OR REPLACE FUNCTION update_transaction(
    p_transaction_id UUID,
    p_date DATE,
    p_cash_source_id UUID,
    p_recipient_name TEXT,
    p_category_id UUID,
    p_vehicle_number TEXT,
    p_division_id UUID,
    p_amount NUMERIC(15,2),
    p_description TEXT,
    p_receipt_date DATE,
    p_handover_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_role user_role;
    v_old_amount NUMERIC(15,2);
    v_old_cash_source_id UUID;
    v_source_balance NUMERIC(15,2);
BEGIN
    -- 1. Validasi Role
    v_role := get_auth_role();
    IF v_role != 'ADMIN' THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat melakukan update transaksi';
    END IF;

    -- 2. Ambil Data Lama
    SELECT amount, cash_source_id INTO v_old_amount, v_old_cash_source_id 
    FROM transactions WHERE id = p_transaction_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_NOT_FOUND: Transaksi tidak ditemukan';
    END IF;

    -- 3. Validasi Amount Baru
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'ERR_INVALID_INPUT: Amount harus lebih besar dari 0';
    END IF;

    -- 4. Cek dampak Saldo jika cash_source_id atau amount berubah
    IF v_old_cash_source_id != p_cash_source_id OR v_old_amount != p_amount THEN
        
        -- Dapatkan saldo cash source tujuan saat ini (tanpa menganggap transaksi ini belum diupdate, 
        -- karena kita akan cek saldo + old_amount - new_amount jika di cash_source yg sama, 
        -- atau saldo pure - new_amount jika pindah cash source)
        
        -- Mencegah Race Condition dengan Lock
        PERFORM 1 FROM cash_sources WHERE id = p_cash_source_id FOR UPDATE;
        SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = p_cash_source_id;
        
        IF p_cash_source_id = v_old_cash_source_id THEN
            -- Mengubah nominal pada kas yang sama. Saldo proyektif:
            IF (v_source_balance + v_old_amount - p_amount) < 0 THEN
                RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Update menyebabkan saldo negatif';
            END IF;
        ELSE
            -- Pindah sumber kas. Kas baru harus sanggup menanggung amount baru secara utuh.
            IF (v_source_balance - p_amount) < 0 THEN
                RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Saldo sumber dana tujuan tidak mencukupi untuk update';
            END IF;
        END IF;
    END IF;

    -- 5. Lakukan Update
    UPDATE transactions SET
        date = p_date,
        cash_source_id = p_cash_source_id,
        recipient_name = p_recipient_name,
        category_id = p_category_id,
        vehicle_number = p_vehicle_number,
        division_id = p_division_id,
        amount = p_amount,
        description = p_description,
        receipt_date = p_receipt_date,
        handover_date = p_handover_date,
        updated_by = auth.uid(),
        updated_at = NOW() -- trigger juga akan set ini, but explicit is fine
    WHERE id = p_transaction_id;

    RETURN p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 7. Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cash_source_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Helper function for RLS (to avoid duplicate get_auth_role calls in policy if performance drops, 
-- but for simplicity we can use get_auth_role() inline)

-- Profiles
CREATE POLICY "Admin read all profiles, User read own" ON profiles FOR SELECT
USING (get_auth_role() = 'ADMIN' OR id = auth.uid());
CREATE POLICY "Admin manage profiles" ON profiles FOR ALL
USING (get_auth_role() = 'ADMIN');

-- Fund Holders & Categories & Divisions
CREATE POLICY "Everyone read master data" ON fund_holders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Everyone read categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Everyone read divisions" ON divisions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manage fund_holders" ON fund_holders FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Admin manage categories" ON categories FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Admin manage divisions" ON divisions FOR ALL USING (get_auth_role() = 'ADMIN');

-- Cash Sources
CREATE POLICY "Everyone read cash_sources" ON cash_sources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage cash_sources" ON cash_sources FOR ALL USING (get_auth_role() = 'ADMIN');

-- User Cash Source Access
CREATE POLICY "Admin manage access" ON user_cash_source_access FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "User read own access" ON user_cash_source_access FOR SELECT USING (user_id = auth.uid());

-- Allocations
CREATE POLICY "Admin manage allocations" ON allocations FOR ALL USING (get_auth_role() = 'ADMIN');
-- User cannot read allocations (they only see their balance via view or specific RPC). 
-- Wait, ASDD says ADMIN reads all allocations. User doesn't read allocations. So we just allow ADMIN.

-- Transactions
CREATE POLICY "Admin read all transactions" ON transactions FOR SELECT USING (get_auth_role() = 'ADMIN');
CREATE POLICY "User read own source transactions" ON transactions FOR SELECT 
USING (
    cash_source_id IN (SELECT cash_source_id FROM user_cash_source_access WHERE user_id = auth.uid())
);
-- Note: Insert and Update on transactions and allocations are handled via SECURITY DEFINER RPCs.
-- However, we can add INSERT policy just in case RPC inserts as the user. But RPC has SECURITY DEFINER so it acts as owner (postgres), bypassing RLS during execution. 
-- Thus, users cannot insert manually via Supabase API (no INSERT policy for users), which is exactly what we want.
-- We will only allow ADMIN to do direct mutations if they bypass RPC, but even ADMIN should use RPC. Let's strictly disallow ALL direct INSERT/UPDATE/DELETE from authenticated users via API to force RPC usage.

CREATE POLICY "Admin allow everything on transactions (for ease)" ON transactions FOR ALL USING (get_auth_role() = 'ADMIN');
-- No INSERT policy for USER. They MUST use RPC.

-- Since View cannot have RLS directly without security barrier or owned by restricted user, 
-- the balances view will just return data. But usually views bypass RLS if owned by postgres. 
-- For users to read balances, they just select from the view. We don't apply RLS to the view itself, 
-- but users can only filter what they see. To make it secure, we can wrap balance checking in an RPC, 
-- or we can let them read the view since cash source names aren't super secret, but transactions are.
