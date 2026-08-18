-- ==============================================================================
-- PHASE 3: PERIOD-BASED IMPREST SYSTEM & LEGACY RECONCILIATION
-- ==============================================================================

-- 1. Custom Types
CREATE TYPE period_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE receipt_status_type AS ENUM ('BELUM ADA', 'SUDAH ADA');
CREATE TYPE reimbursement_status AS ENUM ('BELUM DIGANTI', 'SUDAH DIGANTI');

-- 2. New Tables
CREATE TABLE accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status period_status NOT NULL DEFAULT 'OPEN',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_accounting_periods_updated_at BEFORE UPDATE ON accounting_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Constraint: Only ONE open period allowed at any time
CREATE UNIQUE INDEX idx_one_open_period ON accounting_periods (status) WHERE status = 'OPEN';

CREATE TABLE non_cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id_origin UUID NOT NULL REFERENCES accounting_periods(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    receipt_file_path TEXT,
    status reimbursement_status NOT NULL DEFAULT 'BELUM DIGANTI',
    reimbursed_by_tx_id UUID, 
    reimbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_non_cash_transactions_updated_at BEFORE UPDATE ON non_cash_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Modify Existing Tables
ALTER TABLE transactions 
    ADD COLUMN period_id UUID REFERENCES accounting_periods(id),
    ADD COLUMN receipt_status receipt_status_type NOT NULL DEFAULT 'BELUM ADA',
    ADD COLUMN receipt_file_path TEXT,
    ALTER COLUMN receipt_date DROP NOT NULL,
    ALTER COLUMN handover_date DROP NOT NULL;

ALTER TABLE allocations 
    ADD COLUMN period_id UUID REFERENCES accounting_periods(id);

ALTER TABLE non_cash_transactions 
    ADD CONSTRAINT fk_reimbursed_by_tx_id FOREIGN KEY (reimbursed_by_tx_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- 4. Legacy Data Reconciliation (Atomic Block)
DO $$
DECLARE
    v_legacy_period_id UUID;
    v_system_id UUID;
    v_system_user_id UUID;
    v_rec RECORD;
BEGIN
    -- Determinisitc System Admin Actor
    -- We will insert a system-level profile if not exists to own the legacy sweep
    v_system_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
    
    INSERT INTO auth.users (id, email) VALUES (v_system_user_id, 'system@pku.local') ON CONFLICT DO NOTHING;
    INSERT INTO profiles (id, full_name, role) VALUES (v_system_user_id, 'SYSTEM RECONCILIATION', 'ADMIN') ON CONFLICT DO NOTHING;

    -- Get SYSTEM cash source ID
    SELECT id INTO v_system_id FROM cash_sources WHERE type = 'SYSTEM' LIMIT 1;
    IF v_system_id IS NULL THEN
        RAISE EXCEPTION 'SYSTEM cash source missing!';
    END IF;

    -- Create Legacy Period
    INSERT INTO accounting_periods (name, start_date, end_date, status, created_by)
    VALUES ('Periode Transisi (Legacy)', '2000-01-01', CURRENT_DATE, 'CLOSED', v_system_user_id)
    RETURNING id INTO v_legacy_period_id;

    -- Bind legacy transactions and allocations to the legacy period
    UPDATE transactions SET period_id = v_legacy_period_id WHERE period_id IS NULL;
    UPDATE allocations SET period_id = v_legacy_period_id WHERE period_id IS NULL;

    -- Physical lock on cash sources before calculating view
    PERFORM 1 FROM cash_sources WHERE type IN ('MAIN', 'INDIVIDUAL') FOR UPDATE;

    -- Perform Sweep (Reconciliation) for all MAIN and INDIVIDUAL cash sources
    FOR v_rec IN 
        SELECT cash_source_id, balance FROM v_cash_source_balances WHERE type IN ('MAIN', 'INDIVIDUAL') AND balance > 0
    LOOP
        INSERT INTO allocations (date, source_id, destination_id, amount, description, created_by, updated_by, period_id)
        VALUES (CURRENT_DATE, v_rec.cash_source_id, v_system_id, v_rec.balance, 'Legacy Reconciliation Sweep / Opening Balance Adjustment', v_system_user_id, v_system_user_id, v_legacy_period_id);
    END LOOP;

END $$;

-- Enforce NOT NULL now that legacy data is bound
ALTER TABLE transactions ALTER COLUMN period_id SET NOT NULL;
ALTER TABLE allocations ALTER COLUMN period_id SET NOT NULL;

-- 5. RPC Replacements & Additions

DROP FUNCTION IF EXISTS set_budget_ceiling(NUMERIC, DATE);

-- FUND PERIOD (Atomic)
CREATE OR REPLACE FUNCTION fund_period(
    p_amount NUMERIC(15,2),
    p_period_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
    v_main_id UUID;
    v_system_id UUID;
    v_alloc_id UUID;
    v_period_status period_status;
    v_already_funded BOOLEAN;
BEGIN
    v_role := get_auth_role();
    IF v_role != 'ADMIN' THEN RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat melakukan pendanaan'; END IF;
    IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_INVALID_TARGET: Nilai pendanaan harus lebih besar dari 0'; END IF;

    -- Validate Period and Lock
    SELECT status INTO v_period_status FROM accounting_periods WHERE id = p_period_id FOR UPDATE;
    IF v_period_status IS NULL THEN RAISE EXCEPTION 'ERR_PERIOD_NOT_FOUND: Periode tidak ditemukan'; END IF;
    IF v_period_status != 'OPEN' THEN RAISE EXCEPTION 'ERR_PERIOD_CLOSED: Tidak dapat mendanai periode yang sudah ditutup'; END IF;

    SELECT id INTO v_main_id FROM cash_sources WHERE type = 'MAIN' AND is_active = true LIMIT 1;
    SELECT id INTO v_system_id FROM cash_sources WHERE type = 'SYSTEM' AND is_active = true LIMIT 1;
    
    -- Check if already funded this period from SYSTEM to MAIN
    SELECT EXISTS(
        SELECT 1 FROM allocations 
        WHERE period_id = p_period_id AND source_id = v_system_id AND destination_id = v_main_id
    ) INTO v_already_funded;
    
    IF v_already_funded THEN RAISE EXCEPTION 'ERR_ALREADY_FUNDED: Periode ini sudah menerima pendanaan utama. Hanya satu pendanaan yang diizinkan untuk MVP.'; END IF;

    -- Perform funding allocation
    INSERT INTO allocations (date, source_id, destination_id, amount, description, created_by, updated_by, period_id)
    VALUES (CURRENT_DATE, v_system_id, v_main_id, p_amount, 'Pendanaan Periode', auth.uid(), auth.uid(), p_period_id)
    RETURNING id INTO v_alloc_id;

    RETURN jsonb_build_object('status', 'FUNDED', 'amount', p_amount, 'allocation_id', v_alloc_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- CLOSE PERIOD (Atomic)
CREATE OR REPLACE FUNCTION close_period(
    p_period_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
    v_period_status period_status;
    v_system_id UUID;
    v_rec RECORD;
    v_swept_amount NUMERIC(15,2) := 0;
BEGIN
    v_role := get_auth_role();
    IF v_role != 'ADMIN' THEN RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat melakukan tutup bulan'; END IF;

    -- Lock Period
    SELECT status INTO v_period_status FROM accounting_periods WHERE id = p_period_id FOR UPDATE;
    IF v_period_status IS NULL THEN RAISE EXCEPTION 'ERR_PERIOD_NOT_FOUND: Periode tidak ditemukan'; END IF;
    IF v_period_status = 'CLOSED' THEN RAISE EXCEPTION 'ERR_ALREADY_CLOSED: Periode sudah ditutup'; END IF;

    SELECT id INTO v_system_id FROM cash_sources WHERE type = 'SYSTEM' AND is_active = true LIMIT 1;

    -- 1. Physical Lock on operational cash sources
    PERFORM 1 FROM cash_sources WHERE type IN ('MAIN', 'INDIVIDUAL') FOR UPDATE;

    -- 2. Sweep ALL Operational Cash Sources (MAIN & INDIVIDUAL) reading from view
    FOR v_rec IN 
        SELECT cash_source_id, balance FROM v_cash_source_balances WHERE type IN ('MAIN', 'INDIVIDUAL') AND balance > 0
    LOOP
        INSERT INTO allocations (date, source_id, destination_id, amount, description, created_by, updated_by, period_id)
        VALUES (CURRENT_DATE, v_rec.cash_source_id, v_system_id, v_rec.balance, 'Sweep Closing Return', auth.uid(), auth.uid(), p_period_id);
        
        v_swept_amount := v_swept_amount + v_rec.balance;
    END LOOP;

    -- Update Period Status
    UPDATE accounting_periods SET status = 'CLOSED', updated_at = NOW() WHERE id = p_period_id;

    RETURN jsonb_build_object('status', 'CLOSED', 'total_swept', v_swept_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REPLACE CREATE_TRANSACTION
DROP FUNCTION IF EXISTS create_transaction;
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
    p_handover_date DATE,
    p_period_id UUID,
    p_receipt_status TEXT DEFAULT 'BELUM ADA',
    p_receipt_file_path TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_role user_role;
    v_has_access BOOLEAN;
    v_source_balance NUMERIC(15,2);
    v_trans_id UUID;
    v_period_status period_status;
BEGIN
    v_role := get_auth_role();
    
    -- Validasi Period
    SELECT status INTO v_period_status FROM accounting_periods WHERE id = p_period_id;
    IF v_period_status != 'OPEN' THEN RAISE EXCEPTION 'ERR_PERIOD_CLOSED: Transaksi baru hanya dapat dibuat pada periode OPEN'; END IF;

    -- Validasi Akses
    IF v_role != 'ADMIN' THEN
        SELECT EXISTS (
            SELECT 1 FROM user_cash_source_access 
            WHERE user_id = auth.uid() AND cash_source_id = p_cash_source_id
        ) INTO v_has_access;
        IF NOT v_has_access THEN RAISE EXCEPTION 'ERR_UNAUTHORIZED_SOURCE: Anda tidak memiliki hak akses pada sumber dana ini'; END IF;
    END IF;

    -- Validasi Amount
    IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_INVALID_INPUT: Amount harus lebih besar dari 0'; END IF;

    -- Validasi Saldo
    PERFORM 1 FROM cash_sources WHERE id = p_cash_source_id FOR UPDATE;
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = p_cash_source_id;
    IF v_source_balance IS NULL THEN RAISE EXCEPTION 'ERR_NOT_FOUND: Cash source tidak valid'; END IF;
    IF v_source_balance < p_amount THEN RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Saldo tidak mencukupi (Saldo: %)', v_source_balance; END IF;

    -- Insert
    INSERT INTO transactions (
        date, cash_source_id, recipient_name, category_id, vehicle_number, 
        division_id, amount, description, receipt_date, handover_date, 
        created_by, updated_by, period_id, receipt_status, receipt_file_path
    )
    VALUES (
        p_date, p_cash_source_id, p_recipient_name, p_category_id, p_vehicle_number, 
        p_division_id, p_amount, p_description, p_receipt_date, p_handover_date, 
        auth.uid(), auth.uid(), p_period_id, p_receipt_status::receipt_status_type, p_receipt_file_path
    )
    RETURNING id INTO v_trans_id;

    RETURN v_trans_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REPLACE UPDATE_TRANSACTION (Distinct Financial vs Administrative Mutation)
DROP FUNCTION IF EXISTS update_transaction;
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
    p_handover_date DATE,
    p_receipt_status TEXT DEFAULT 'BELUM ADA',
    p_receipt_file_path TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_role user_role;
    v_old transactions%ROWTYPE;
    v_source_balance NUMERIC(15,2);
    v_period_status period_status;
    v_financial_changed BOOLEAN;
BEGIN
    v_role := get_auth_role();
    
    SELECT * INTO v_old FROM transactions WHERE id = p_transaction_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_NOT_FOUND: Transaksi tidak ditemukan'; END IF;

    -- Determine if financial data is mutating
    v_financial_changed := (
        v_old.date != p_date OR
        v_old.cash_source_id != p_cash_source_id OR
        v_old.recipient_name != p_recipient_name OR
        v_old.category_id != p_category_id OR
        COALESCE(v_old.vehicle_number, '') != COALESCE(p_vehicle_number, '') OR
        v_old.division_id != p_division_id OR
        v_old.amount != p_amount OR
        COALESCE(v_old.description, '') != COALESCE(p_description, '')
    );

    SELECT status INTO v_period_status FROM accounting_periods WHERE id = v_old.period_id;
    
    -- Strict financial lock on CLOSED periods
    IF v_period_status = 'CLOSED' AND v_financial_changed THEN 
        RAISE EXCEPTION 'ERR_PERIOD_CLOSED: Tidak dapat mengubah data finansial (amount, tanggal, sumber, dsb) pada periode yang sudah ditutup'; 
    END IF;

    -- Validate Role Access
    IF v_role != 'ADMIN' THEN 
        -- If NOT ADMIN, they can only update Administrative data (receipt) if they have access to source.
        -- We won't allow User to edit financials even in OPEN period if that is the old rule. 
        -- Wait, old rule allowed ONLY ADMIN to update transactions! 
        -- Oh, old rule: IF v_role != 'ADMIN' THEN RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat melakukan update transaksi'; END IF;
        -- Let's keep that rule for financial updates. But for administrative updates (upload receipt), users should be allowed?
        -- For MVP, let's just stick to ADMIN only, OR if we want user to upload receipt, we must allow it.
        IF v_financial_changed THEN
            RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat mengubah data finansial transaksi';
        ELSE
            -- User can only upload receipt if they have access to the cash source
            IF NOT EXISTS (SELECT 1 FROM user_cash_source_access WHERE user_id = auth.uid() AND cash_source_id = v_old.cash_source_id) THEN
                RAISE EXCEPTION 'ERR_UNAUTHORIZED: Anda tidak memiliki akses ke kuitansi sumber dana ini';
            END IF;
        END IF;
    END IF;

    IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_INVALID_INPUT: Amount harus lebih besar dari 0'; END IF;

    IF v_financial_changed AND (v_old.cash_source_id != p_cash_source_id OR v_old.amount != p_amount) THEN
        PERFORM 1 FROM cash_sources WHERE id = p_cash_source_id FOR UPDATE;
        SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = p_cash_source_id;
        
        IF p_cash_source_id = v_old.cash_source_id THEN
            IF (v_source_balance + v_old.amount - p_amount) < 0 THEN
                RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Update menyebabkan saldo negatif';
            END IF;
        ELSE
            IF (v_source_balance - p_amount) < 0 THEN
                RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Saldo sumber dana tujuan tidak mencukupi untuk update';
            END IF;
        END IF;
    END IF;

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
        receipt_status = p_receipt_status::receipt_status_type,
        receipt_file_path = p_receipt_file_path,
        updated_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_transaction_id;

    RETURN p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REPLACE CREATE_ALLOCATION
DROP FUNCTION IF EXISTS create_allocation;
CREATE OR REPLACE FUNCTION create_allocation(
    p_date DATE,
    p_source_id UUID,
    p_destination_id UUID,
    p_amount NUMERIC(15,2),
    p_description TEXT,
    p_period_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_role user_role;
    v_source_balance NUMERIC(15,2);
    v_alloc_id UUID;
    v_period_status period_status;
BEGIN
    v_role := get_auth_role();
    IF v_role != 'ADMIN' THEN RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat membuat allocation'; END IF;
    
    SELECT status INTO v_period_status FROM accounting_periods WHERE id = p_period_id;
    IF v_period_status != 'OPEN' THEN RAISE EXCEPTION 'ERR_PERIOD_CLOSED: Alokasi hanya dapat dibuat pada periode OPEN'; END IF;

    IF p_source_id = p_destination_id THEN RAISE EXCEPTION 'ERR_SAME_SOURCE_DEST: Source dan Destination tidak boleh sama'; END IF;
    IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_INVALID_INPUT: Amount harus lebih besar dari 0'; END IF;

    PERFORM 1 FROM cash_sources WHERE id = p_source_id FOR UPDATE;
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = p_source_id;
    
    IF v_source_balance IS NULL THEN RAISE EXCEPTION 'ERR_NOT_FOUND: Source cash source tidak valid'; END IF;
    IF v_source_balance < p_amount THEN RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Saldo source tidak mencukupi (Saldo: %)', v_source_balance; END IF;

    INSERT INTO allocations (date, source_id, destination_id, amount, description, created_by, updated_by, period_id)
    VALUES (p_date, p_source_id, p_destination_id, p_amount, p_description, auth.uid(), auth.uid(), p_period_id)
    RETURNING id INTO v_alloc_id;

    RETURN v_alloc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REIMBURSE NON CASH (Atomic)
CREATE OR REPLACE FUNCTION reimburse_non_cash(
    p_non_cash_id UUID,
    p_period_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
    v_status reimbursement_status;
    v_amount NUMERIC(15,2);
    v_desc TEXT;
    v_user UUID;
    v_main_id UUID;
    v_source_balance NUMERIC(15,2);
    v_trans_id UUID;
    v_period_status period_status;
BEGIN
    v_role := get_auth_role();
    IF v_role != 'ADMIN' THEN RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat melakukan reimbursement'; END IF;

    -- Validate Period OPEN
    SELECT status INTO v_period_status FROM accounting_periods WHERE id = p_period_id;
    IF v_period_status != 'OPEN' THEN RAISE EXCEPTION 'ERR_PERIOD_CLOSED: Periode saat ini sudah ditutup'; END IF;

    -- Lock the Non-Cash row
    SELECT status, amount, description, user_id INTO v_status, v_amount, v_desc, v_user 
    FROM non_cash_transactions WHERE id = p_non_cash_id FOR UPDATE;
    
    IF v_status IS NULL THEN RAISE EXCEPTION 'ERR_NOT_FOUND: Data Non Kas Kecil tidak ditemukan'; END IF;
    IF v_status = 'SUDAH DIGANTI' THEN RAISE EXCEPTION 'ERR_ALREADY_REIMBURSED: Transaksi ini sudah diganti sebelumnya'; END IF;

    SELECT id INTO v_main_id FROM cash_sources WHERE type = 'MAIN' AND is_active = true LIMIT 1;
    
    -- Lock MAIN source
    PERFORM 1 FROM cash_sources WHERE id = v_main_id FOR UPDATE;
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = v_main_id;
    
    IF v_source_balance < v_amount THEN RAISE EXCEPTION 'ERR_INSUFFICIENT_FUNDS: Saldo MAIN tidak mencukupi untuk reimbursement (Butuh: %, Tersedia: %)', v_amount, v_source_balance; END IF;

    -- Create physical transaction from MAIN (linked to the OPEN period)
    INSERT INTO transactions (
        date, cash_source_id, recipient_name, category_id, division_id, amount, description, 
        created_by, updated_by, period_id, receipt_status
    )
    VALUES (
        CURRENT_DATE, v_main_id, (SELECT full_name FROM profiles WHERE id = v_user), 
        (SELECT id FROM categories LIMIT 1), (SELECT id FROM divisions LIMIT 1), 
        v_amount, 'Reimbursement: ' || v_desc, auth.uid(), auth.uid(), p_period_id, 'SUDAH ADA'
    )
    RETURNING id INTO v_trans_id;

    -- Mark as Reimbursed
    UPDATE non_cash_transactions SET 
        status = 'SUDAH DIGANTI', 
        reimbursed_by_tx_id = v_trans_id, 
        reimbursed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_non_cash_id;

    RETURN jsonb_build_object('status', 'SUCCESS', 'reimbursement_tx_id', v_trans_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Row Level Security Policies (RLS)
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone read periods" ON accounting_periods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage periods" ON accounting_periods FOR ALL USING (get_auth_role() = 'ADMIN');

CREATE POLICY "Admin read all non-cash" ON non_cash_transactions FOR SELECT USING (get_auth_role() = 'ADMIN');
CREATE POLICY "User read own non-cash" ON non_cash_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User create non-cash" ON non_cash_transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage non-cash" ON non_cash_transactions FOR UPDATE USING (get_auth_role() = 'ADMIN');

-- 7. Storage Bucket & Policies (Private & IDOR Protected)
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload receipts for their cash sources"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND 
  (string_to_array(name, '/'))[1]::uuid IN (SELECT cash_source_id FROM user_cash_source_access WHERE user_id = auth.uid())
);

CREATE POLICY "Users can read receipts for their cash sources"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts' AND 
  (string_to_array(name, '/'))[1]::uuid IN (SELECT cash_source_id FROM user_cash_source_access WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update/replace receipts for their cash sources"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'receipts' AND 
  (string_to_array(name, '/'))[1]::uuid IN (SELECT cash_source_id FROM user_cash_source_access WHERE user_id = auth.uid())
);

CREATE POLICY "Admin full access to receipts"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'receipts' AND get_auth_role() = 'ADMIN');
