-- REPLACE UPDATE_TRANSACTION (Allow USER to edit financial data if period is OPEN)
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

    -- Validate Role Access (Both for Financial and Administrative)
    IF v_role != 'ADMIN' THEN 
        -- User MUST have access to the cash source to edit anything (both old and new source if changing)
        IF NOT EXISTS (SELECT 1 FROM user_cash_source_access WHERE user_id = auth.uid() AND cash_source_id = v_old.cash_source_id) THEN
            RAISE EXCEPTION 'ERR_UNAUTHORIZED: Anda tidak memiliki akses ke sumber dana asal transaksi ini';
        END IF;
        
        IF p_cash_source_id != v_old.cash_source_id THEN
            IF NOT EXISTS (SELECT 1 FROM user_cash_source_access WHERE user_id = auth.uid() AND cash_source_id = p_cash_source_id) THEN
                RAISE EXCEPTION 'ERR_UNAUTHORIZED: Anda tidak memiliki akses ke sumber dana tujuan transaksi ini';
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
        receipt_file_path = p_receipt_file_path
    WHERE id = p_transaction_id;

    RETURN p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_transaction(UUID, DATE, UUID, TEXT, UUID, TEXT, UUID, NUMERIC, TEXT, DATE, DATE, TEXT, TEXT) TO authenticated;
