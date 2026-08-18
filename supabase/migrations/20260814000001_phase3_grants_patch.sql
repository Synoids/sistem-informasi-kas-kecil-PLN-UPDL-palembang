-- ==============================================================================
-- PHASE 3 PATCH: GRANT PERMISSIONS FOR NEW SCHEMA
-- ==============================================================================

-- 1. Grant table access to Authenticated Users (PostgREST session)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_periods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.non_cash_transactions TO authenticated;

-- 2. Grant table access to Service Role (Backend/Bypass)
GRANT ALL ON public.accounting_periods TO service_role;
GRANT ALL ON public.non_cash_transactions TO service_role;

-- 3. Restore Service Role access to existing tables (fixing the audit error we hit earlier)
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.allocations TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.cash_sources TO service_role;
GRANT ALL ON public.user_cash_source_access TO service_role;

-- 4. Grant Execute Permissions on Phase 3 RPCs to Authenticated Users
GRANT EXECUTE ON FUNCTION public.fund_period(NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_period(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transaction(DATE, UUID, TEXT, UUID, TEXT, UUID, NUMERIC, TEXT, DATE, DATE, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_transaction(UUID, DATE, UUID, TEXT, UUID, TEXT, UUID, NUMERIC, TEXT, DATE, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_allocation(DATE, UUID, UUID, NUMERIC, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reimburse_non_cash(UUID, UUID) TO authenticated;
