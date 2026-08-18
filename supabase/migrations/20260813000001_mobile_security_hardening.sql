-- ==============================================================================
-- PHASE 1: MOBILE SECURITY HARDENING
-- ==============================================================================

-- 1. HARDEN RLS PADA CASH_SOURCES
-- Menghapus policy eksisting yang terlalu longgar
DROP POLICY IF EXISTS "Everyone read cash_sources" ON public.cash_sources;

-- Membuat policy ketat: ADMIN melihat semua, USER melihat miliknya saja.
CREATE POLICY "Read allowed cash_sources" ON public.cash_sources FOR SELECT 
USING (
    get_auth_role() = 'ADMIN' OR 
    id IN (SELECT cash_source_id FROM public.user_cash_source_access WHERE user_id = auth.uid())
);

-- 2. BUAT RPC get_authorized_balances()
-- RPC ini adalah jembatan satu-satunya yang aman bagi Mobile untuk melihat saldo.
CREATE OR REPLACE FUNCTION public.get_authorized_balances()
RETURNS TABLE (
    cash_source_id UUID,
    code TEXT,
    name TEXT,
    type cash_source_type,
    is_active BOOLEAN,
    balance NUMERIC
) AS $$
DECLARE
    v_role user_role;
BEGIN
    v_role := public.get_auth_role();

    IF v_role = 'ADMIN' THEN
        -- Admin boleh melihat semua kas kecuali SYSTEM (secara konvensi SYSTEM di-hide dari UI umum)
        RETURN QUERY SELECT v.cash_source_id, v.code, v.name, v.type, v.is_active, v.balance 
        FROM public.v_cash_source_balances v 
        WHERE v.is_active = true AND v.type != 'SYSTEM';
    ELSE
        -- User hanya boleh melihat kas yang aksesnya dimilikinya
        RETURN QUERY SELECT v.cash_source_id, v.code, v.name, v.type, v.is_active, v.balance 
        FROM public.v_cash_source_balances v 
        WHERE v.cash_source_id IN (
            SELECT u.cash_source_id FROM public.user_cash_source_access u WHERE u.user_id = auth.uid()
        ) AND v.is_active = true AND v.type != 'SYSTEM';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. GRANT & REVOKE PRIVILEGES
-- Amankan dari serangan Anon/Public
REVOKE EXECUTE ON FUNCTION public.get_authorized_balances() FROM public;
REVOKE EXECUTE ON FUNCTION public.create_transaction(DATE, UUID, TEXT, UUID, TEXT, UUID, NUMERIC, TEXT, DATE, DATE) FROM public;

-- Berikan otorisasi murni pada user otentik (JWT pemegang session valid)
GRANT EXECUTE ON FUNCTION public.get_authorized_balances() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transaction(DATE, UUID, TEXT, UUID, TEXT, UUID, NUMERIC, TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_authorized_balances() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_transaction(DATE, UUID, TEXT, UUID, TEXT, UUID, NUMERIC, TEXT, DATE, DATE) TO service_role;
