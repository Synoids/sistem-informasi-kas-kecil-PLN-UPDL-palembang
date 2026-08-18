import { supabase } from '../lib/supabase';
// The return type matches the RPC get_authorized_balances
export type AuthorizedBalance = {
  cash_source_id: string;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  balance: number;
};

export const cashService = {
  async getAuthorizedBalances(): Promise<AuthorizedBalance[]> {
    const { data, error } = await supabase.rpc('get_authorized_balances');
    
    if (error) {
      console.error('Error fetching authorized balances', error);
      throw error;
    }
    
    return data as AuthorizedBalance[];
  }
};
