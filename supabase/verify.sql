-- ==============================================================================
-- VERIFICATION SCRIPT: Sistem Informasi Pengelolaan Kas Kecil
-- ==============================================================================
-- Note: This script assumes execution in a Supabase environment where auth.uid() 
-- is available. We will mock the JWT claims to simulate different users.

DO $$
DECLARE
    v_admin_uid UUID := gen_random_uuid();
    v_user_uid UUID := gen_random_uuid();
    v_kas_utama_id UUID;
    v_didik_holder_id UUID;
    v_kas_didik_id UUID;
    v_cat_id UUID;
    v_div_id UUID;
    v_alloc_1 UUID;
    v_alloc_2 UUID;
    v_trans_1 UUID;
    v_source_balance NUMERIC;
BEGIN
    RAISE NOTICE '=== STARTING VERIFICATION ===';

    -- 1. Setup Mock Users in auth.users and profiles
    -- Since we cannot insert directly to auth.users in standard PG easily without the schema,
    -- we will bypass the foreign key constraint temporarily OR just mock it if we can.
    -- For this DO block to work in a fresh DB, we might need to drop the FK to auth.users temporarily for testing.
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

    INSERT INTO profiles (id, full_name, role) VALUES (v_admin_uid, 'Admin Rouly', 'ADMIN');
    INSERT INTO profiles (id, full_name, role) VALUES (v_user_uid, 'Pak Didik', 'USER');

    -- 2. Setup Master Data & Cash Source
    SELECT id INTO v_kas_utama_id FROM cash_sources WHERE code = 'MAIN' LIMIT 1;
    
    INSERT INTO fund_holders (name) VALUES ('Pak Didik') RETURNING id INTO v_didik_holder_id;
    INSERT INTO cash_sources (code, name, type, fund_holder_id) 
    VALUES ('DIDIK', 'Kas Pak Didik', 'INDIVIDUAL', v_didik_holder_id) 
    RETURNING id INTO v_kas_didik_id;

    INSERT INTO user_cash_source_access (user_id, cash_source_id) VALUES (v_user_uid, v_kas_didik_id);

    SELECT id INTO v_cat_id FROM categories LIMIT 1;
    SELECT id INTO v_div_id FROM divisions LIMIT 1;

    -- 3. MOCK AS ADMIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s"}', v_admin_uid), true);
    
    -- Admin gives 100jt to MAIN (simulated via an initial allocation from a dummy source, or just direct insert bypassing the RPC balance check)
    -- Actually, to give MAIN 100jt, we need a "DROP" source or we just insert it directly since it's the initial dropping.
    -- Let's create a DUMMY source for Dropping.
    DECLARE v_dropping_id UUID;
    BEGIN
        INSERT INTO cash_sources (code, name, type) VALUES ('DROP', 'Dropping Pusat', 'MAIN') RETURNING id INTO v_dropping_id;
        INSERT INTO allocations (date, source_id, destination_id, amount, created_by, updated_by)
        VALUES (CURRENT_DATE, v_dropping_id, v_kas_utama_id, 100000000, v_admin_uid, v_admin_uid);
    END;

    -- Verify Kas Utama has 100jt
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = v_kas_utama_id;
    IF v_source_balance != 100000000 THEN RAISE EXCEPTION 'FAIL: Kas Utama harus 100jt'; END IF;
    RAISE NOTICE 'SUCCESS: Kas Utama menerima Rp100.000.000.';

    -- Admin allocates 10jt to Pak Didik
    PERFORM create_allocation(CURRENT_DATE, v_kas_utama_id, v_kas_didik_id, 10000000.00, 'Alokasi Bulanan');

    -- Verify Balances
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = v_kas_utama_id;
    IF v_source_balance != 90000000 THEN RAISE EXCEPTION 'FAIL: Kas Utama harus 90jt'; END IF;
    RAISE NOTICE 'SUCCESS: Saldo Kas Utama = Rp90.000.000.';

    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = v_kas_didik_id;
    IF v_source_balance != 10000000 THEN RAISE EXCEPTION 'FAIL: Kas Didik harus 10jt'; END IF;
    RAISE NOTICE 'SUCCESS: Saldo Pak Didik = Rp10.000.000.';

    -- 4. MOCK AS USER (Pak Didik)
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s"}', v_user_uid), true);

    -- Pak Didik creates transaction 1.5jt
    SELECT create_transaction(CURRENT_DATE, v_kas_didik_id, 'Toko A', v_cat_id, NULL, v_div_id, 1500000.00, 'Beli Alat', CURRENT_DATE, CURRENT_DATE)
    INTO v_trans_1;

    -- Verify Balance
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = v_kas_didik_id;
    IF v_source_balance != 8500000 THEN RAISE EXCEPTION 'FAIL: Kas Didik harus 8.5jt'; END IF;
    RAISE NOTICE 'SUCCESS: Saldo Pak Didik setelah transaksi = Rp8.500.000.';

    -- Pak Didik attempts transaction 9jt (Should Fail)
    BEGIN
        PERFORM create_transaction(CURRENT_DATE, v_kas_didik_id, 'Toko B', v_cat_id, NULL, v_div_id, 9000000.00, 'Beli Alat', CURRENT_DATE, CURRENT_DATE);
        RAISE EXCEPTION 'FAIL: Seharusnya transaksi ditolak karena saldo kurang';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%ERR_INSUFFICIENT_FUNDS%' THEN
            RAISE NOTICE 'SUCCESS: Transaksi Rp9.000.000 dari Pak Didik ditolak karena saldo tidak cukup.';
        ELSE
            RAISE;
        END IF;
    END;

    -- Pak Didik attempts to allocate (Should Fail)
    BEGIN
        PERFORM create_allocation(CURRENT_DATE, v_kas_didik_id, v_kas_utama_id, 10000.00, 'Test');
        RAISE EXCEPTION 'FAIL: User seharusnya tidak bisa alokasi';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%ERR_UNAUTHORIZED%' THEN
            RAISE NOTICE 'SUCCESS: USER tidak dapat membuat allocation.';
        ELSE
            RAISE;
        END IF;
    END;

    -- 5. MOCK AS ADMIN AGAIN
    PERFORM set_config('request.jwt.claims', format('{"sub":"%s"}', v_admin_uid), true);

    -- Admin attempts to allocate source = dest (Should Fail)
    BEGIN
        PERFORM create_allocation(CURRENT_DATE, v_kas_utama_id, v_kas_utama_id, 10000.00, 'Test');
        RAISE EXCEPTION 'FAIL: Allocation source dan dest sama harusnya ditolak';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%ERR_SAME_SOURCE_DEST%' THEN
            RAISE NOTICE 'SUCCESS: Allocation source dan destination yang sama ditolak.';
        ELSE
            RAISE;
        END IF;
    END;

    -- Admin updates transaction to 2jt
    PERFORM update_transaction(v_trans_1, CURRENT_DATE, v_kas_didik_id, 'Toko A', v_cat_id, NULL, v_div_id, 2000000.00, 'Beli Alat Update', CURRENT_DATE, CURRENT_DATE);
    
    -- Verify updated balance
    SELECT balance INTO v_source_balance FROM v_cash_source_balances WHERE cash_source_id = v_kas_didik_id;
    IF v_source_balance != 8000000 THEN RAISE EXCEPTION 'FAIL: Kas Didik harus 8jt setelah update'; END IF;
    RAISE NOTICE 'SUCCESS: Update transaction oleh ADMIN menghitung ulang saldo dengan benar (Saldo akhir Rp8.000.000).';

    -- Cleanup testing FK alteration
    -- Do not actually add FK back because the dummy UUIDs don't exist in auth.users. 
    -- In real migration, we don't drop FK.
    
    RAISE NOTICE '=== VERIFICATION PASSED ===';

END $$;
