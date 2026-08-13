-- 1. Add SYSTEM to cash_source_type safely
ALTER TYPE cash_source_type ADD VALUE IF NOT EXISTS 'SYSTEM';

-- 2. Seed SYSTEM cash source if it doesn't exist
INSERT INTO cash_sources (id, code, name, type, is_active)
SELECT gen_random_uuid(), 'SYS', 'Rekening Bank / Pusat', 'SYSTEM', true
WHERE NOT EXISTS (
    SELECT 1 FROM cash_sources WHERE type = 'SYSTEM'
);

-- 3. Create RPC set_budget_ceiling
CREATE OR REPLACE FUNCTION set_budget_ceiling(
    p_target_amount NUMERIC(15,2),
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_role user_role;
    v_main_id UUID;
    v_system_id UUID;
    v_current_balance NUMERIC(15,2);
    v_difference NUMERIC(15,2);
    v_alloc_id UUID;
    v_direction TEXT;
BEGIN
    -- 1. Validasi Authenticated User & Role ADMIN
    v_role := get_auth_role();
    IF v_role != 'ADMIN' THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Hanya ADMIN yang dapat menetapkan pagu kas';
    END IF;

    -- 2. Validasi Target Amount
    IF p_target_amount <= 0 OR p_target_amount IS NULL THEN
        RAISE EXCEPTION 'ERR_INVALID_TARGET: Target pagu harus lebih besar dari 0';
    END IF;

    -- 3. Cari Cash Source MAIN dan SYSTEM berdasarkan type
    SELECT id INTO v_main_id FROM cash_sources WHERE type = 'MAIN' AND is_active = true LIMIT 1;
    IF v_main_id IS NULL THEN
        RAISE EXCEPTION 'ERR_MAIN_NOT_FOUND: Kas Utama tidak ditemukan atau tidak aktif';
    END IF;

    SELECT id INTO v_system_id FROM cash_sources WHERE type = 'SYSTEM' AND is_active = true LIMIT 1;
    IF v_system_id IS NULL THEN
        RAISE EXCEPTION 'ERR_SYSTEM_NOT_FOUND: Sumber dana eksternal SYSTEM tidak ditemukan';
    END IF;

    -- 4. Lock MAIN source untuk mencegah Race Condition
    PERFORM 1 FROM cash_sources WHERE id = v_main_id FOR UPDATE;

    -- 5. Hitung Saldo MAIN Terkini dari v_cash_source_balances (source of truth)
    SELECT balance INTO v_current_balance FROM v_cash_source_balances WHERE cash_source_id = v_main_id;
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    -- 6. Hitung Selisih
    v_difference := p_target_amount - v_current_balance;

    -- Jika tidak ada perubahan
    IF v_difference = 0 THEN
        RETURN jsonb_build_object(
            'status', 'NO_CHANGE',
            'current_balance_before', v_current_balance,
            'target_amount', p_target_amount,
            'adjustment_amount', 0,
            'direction', NULL,
            'allocation_id', NULL
        );
    END IF;

    -- Jika defisit, MAIN butuh dana dari SYSTEM (Pengisian Pagu)
    IF v_difference > 0 THEN
        INSERT INTO allocations (date, source_id, destination_id, amount, description, created_by, updated_by)
        VALUES (p_date, v_system_id, v_main_id, v_difference, 'Pengisian Pagu Kas Utama', auth.uid(), auth.uid())
        RETURNING id INTO v_alloc_id;
        
        v_direction := 'SYSTEM_TO_MAIN';
        
        RETURN jsonb_build_object(
            'status', 'REPLENISHED',
            'current_balance_before', v_current_balance,
            'target_amount', p_target_amount,
            'adjustment_amount', v_difference,
            'direction', v_direction,
            'allocation_id', v_alloc_id
        );
    END IF;

    -- Jika surplus, MAIN mengembalikan dana ke SYSTEM
    IF v_difference < 0 THEN
        -- Secara matematis saldo mencukupi karena v_current_balance > p_target_amount (dan p_target_amount > 0)
        INSERT INTO allocations (date, source_id, destination_id, amount, description, created_by, updated_by)
        VALUES (p_date, v_main_id, v_system_id, abs(v_difference), 'Pengembalian Kelebihan Pagu Kas Utama', auth.uid(), auth.uid())
        RETURNING id INTO v_alloc_id;
        
        v_direction := 'MAIN_TO_SYSTEM';
        
        RETURN jsonb_build_object(
            'status', 'RETURNED',
            'current_balance_before', v_current_balance,
            'target_amount', p_target_amount,
            'adjustment_amount', abs(v_difference),
            'direction', v_direction,
            'allocation_id', v_alloc_id
        );
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
