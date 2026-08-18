import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

export const transactionService = {
  async getHistory(): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions', error);
      throw error;
    }

    return data;
  },

  async createTransaction(payload: {
    date: string;
    cash_source_id: string;
    recipient_name: string;
    category_id: string;
    vehicle_number?: string;
    division_id: string;
    amount: number;
    description: string;
    receipt_date: string;
    handover_date: string;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_transaction', {
      p_date: payload.date,
      p_cash_source_id: payload.cash_source_id,
      p_recipient_name: payload.recipient_name,
      p_category_id: payload.category_id,
      p_vehicle_number: payload.vehicle_number || null,
      p_division_id: payload.division_id,
      p_amount: payload.amount,
      p_description: payload.description || null,
      p_receipt_date: payload.receipt_date,
      p_handover_date: payload.handover_date
    } as any);

    if (error) {
      console.error('Error creating transaction', error);
      throw error;
    }

    return data;
  }
};
