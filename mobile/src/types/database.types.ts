export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'ADMIN' | 'USER'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'ADMIN' | 'USER'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'ADMIN' | 'USER'
          created_at?: string
          updated_at?: string
        }
      }
      fund_holders: {
        Row: {
          id: string
          name: string
          employee_id: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          employee_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          employee_id?: string | null
          is_active?: boolean
        }
      }
      cash_sources: {
        Row: {
          id: string
          code: string
          name: string
          type: 'MAIN' | 'INDIVIDUAL' | 'SYSTEM'
          fund_holder_id: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          code: string
          name: string
          type: 'MAIN' | 'INDIVIDUAL' | 'SYSTEM'
          fund_holder_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          code?: string
          name?: string
          type?: 'MAIN' | 'INDIVIDUAL' | 'SYSTEM'
          fund_holder_id?: string | null
          is_active?: boolean
        }
      }
      user_cash_source_access: {
        Row: {
          user_id: string
          cash_source_id: string
        }
        Insert: {
          user_id: string
          cash_source_id: string
        }
        Update: {
          user_id?: string
          cash_source_id?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
        }
      }
      divisions: {
        Row: {
          id: string
          name: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
        }
      }
      allocations: {
        Row: {
          id: string
          date: string
          source_id: string
          destination_id: string
          amount: number
          description: string | null
          created_by: string
          created_at: string
          updated_by: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          source_id: string
          destination_id: string
          amount: number
          description?: string | null
          created_by: string
          created_at?: string
          updated_by: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          source_id?: string
          destination_id?: string
          amount?: number
          description?: string | null
          created_by?: string
          created_at?: string
          updated_by?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          date: string
          cash_source_id: string
          recipient_name: string
          category_id: string
          vehicle_number: string | null
          division_id: string
          amount: number
          description: string | null
          receipt_date: string
          handover_date: string
          created_by: string
          created_at: string
          updated_by: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          cash_source_id: string
          recipient_name: string
          category_id: string
          vehicle_number?: string | null
          division_id: string
          amount: number
          description?: string | null
          receipt_date: string
          handover_date: string
          created_by: string
          created_at?: string
          updated_by: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          cash_source_id?: string
          recipient_name?: string
          category_id?: string
          vehicle_number?: string | null
          division_id?: string
          amount?: number
          description?: string | null
          receipt_date?: string
          handover_date?: string
          created_by?: string
          created_at?: string
          updated_by?: string
          updated_at?: string
        }
      }
    }
    Views: {
      v_cash_source_balances: {
        Row: {
          cash_source_id: string
          code: string
          name: string
          type: 'MAIN' | 'INDIVIDUAL'
          is_active: boolean
          balance: number
        }
      }
    }
    Functions: {
      create_allocation: {
        Args: {
          p_date: string
          p_source_id: string
          p_destination_id: string
          p_amount: number
          p_description: string
        }
        Returns: string
      }
      get_authorized_balances: {
        Args: Record<PropertyKey, never>
        Returns: {
          cash_source_id: string
          code: string
          name: string
          type: 'MAIN' | 'INDIVIDUAL' | 'SYSTEM'
          is_active: boolean
          balance: number
        }[]
      }
      create_transaction: {
        Args: {
          p_date: string
          p_cash_source_id: string
          p_recipient_name: string
          p_category_id: string
          p_vehicle_number: string | null
          p_division_id: string
          p_amount: number
          p_description: string | null
          p_receipt_date: string
          p_handover_date: string
        }
        Returns: string
      }
      update_transaction: {
        Args: {
          p_transaction_id: string
          p_date: string
          p_cash_source_id: string
          p_recipient_name: string
          p_category_id: string
          p_vehicle_number: string | null
          p_division_id: string
          p_amount: number
          p_description: string | null
          p_receipt_date: string
          p_handover_date: string
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'ADMIN' | 'USER'
      cash_source_type: 'MAIN' | 'INDIVIDUAL' | 'SYSTEM'
    }
  }
}
