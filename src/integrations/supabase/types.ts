export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget_analysis: {
        Row: {
          budget_amount: number | null
          budget_type: string | null
          category: string | null
          end_date: string | null
          percent_used: number | null
          period: string | null
          source_name: string | null
          spent_amount: number | null
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          budget_amount?: number | null
          budget_type?: string | null
          category?: string | null
          end_date?: string | null
          percent_used?: number | null
          period?: string | null
          source_name?: string | null
          spent_amount?: number | null
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          budget_amount?: number | null
          budget_type?: string | null
          category?: string | null
          end_date?: string | null
          percent_used?: number | null
          period?: string | null
          source_name?: string | null
          spent_amount?: number | null
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          amount: number
          budget_type: string
          category: string
          color: string
          created_at: string | null
          end_date: string | null
          id: string
          percent_value: number | null
          period: string
          source_id: string | null
          source_name: string | null
          spent: number | null
          start_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          budget_type: string
          category: string
          color: string
          created_at?: string | null
          end_date?: string | null
          id: string
          percent_value?: number | null
          period: string
          source_id?: string | null
          source_name?: string | null
          spent?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          budget_type?: string
          category?: string
          color?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          percent_value?: number | null
          period?: string
          source_id?: string | null
          source_name?: string | null
          spent?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      budget_sources: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          active: boolean | null
          amount: number
          category: string
          created_at: string | null
          id: string
          period: string
          spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          amount: number
          category: string
          created_at?: string | null
          id?: string
          period: string
          spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          amount?: number
          category?: string
          created_at?: string | null
          id?: string
          period?: string
          spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id: string
          name: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      debt_contacts: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name: string
          notes?: string | null
          phone?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      debt_items: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          installments: number | null
          lender: string | null
          remaining_amount: number
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
          wallet_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id: string
          installments?: number | null
          lender?: string | null
          remaining_amount: number
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          wallet_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          installments?: number | null
          lender?: string | null
          remaining_amount?: number
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          wallet_name?: string | null
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string | null
          debt_id: string | null
          id: string
          payment_date: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          debt_id?: string | null
          id: string
          payment_date: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          debt_id?: string | null
          id?: string
          payment_date?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debt_items"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expired_budgets: {
        Row: {
          amount: number
          budget_type: string
          category: string
          color: string
          created_at: string | null
          end_date: string | null
          id: string
          percent_value: number | null
          period: string
          source_id: string | null
          source_name: string | null
          spent: number | null
          start_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          budget_type: string
          category: string
          color: string
          created_at?: string | null
          end_date?: string | null
          id: string
          percent_value?: number | null
          period: string
          source_id?: string | null
          source_name?: string | null
          spent?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          budget_type?: string
          category?: string
          color?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          percent_value?: number | null
          period?: string
          source_id?: string | null
          source_name?: string | null
          spent?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount: number
          borrower: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          paid_amount: number | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          borrower?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          paid_amount?: number | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          borrower?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          paid_amount?: number | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      savings: {
        Row: {
          created_at: string | null
          current_amount: number | null
          description: string | null
          id: string
          name: string
          savings_category: string | null
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          id?: string
          name: string
          savings_category?: string | null
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          id?: string
          name?: string
          savings_category?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string | null
          current: number | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          savings_type: string | null
          target: number
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          created_at?: string | null
          current?: number | null
          description?: string | null
          end_date?: string | null
          id: string
          name: string
          savings_type?: string | null
          target: number
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          created_at?: string | null
          current?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          savings_type?: string | null
          target?: number
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: []
      }
      savings_transactions: {
        Row: {
          created_at: string | null
          deskripsi: string | null
          id: string
          jenistransaksi: string | null
          kategori: string | null
          pemasukan: string | null
          pengeluaran: string | null
          savings_id: string | null
          savings_name: string | null
          status: string | null
          tanggal: string | null
          transaction_description: string | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deskripsi?: string | null
          id: string
          jenistransaksi?: string | null
          kategori?: string | null
          pemasukan?: string | null
          pengeluaran?: string | null
          savings_id?: string | null
          savings_name?: string | null
          status?: string | null
          tanggal?: string | null
          transaction_description?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deskripsi?: string | null
          id?: string
          jenistransaksi?: string | null
          kategori?: string | null
          pemasukan?: string | null
          pengeluaran?: string | null
          savings_id?: string | null
          savings_name?: string | null
          status?: string | null
          tanggal?: string | null
          transaction_description?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          destination_wallet_id: string | null
          fee: number | null
          id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          destination_wallet_id?: string | null
          fee?: number | null
          id?: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          destination_wallet_id?: string | null
          fee?: number | null
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_destination_wallet_id_fkey"
            columns: ["destination_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          show_budgeting: boolean
          show_loans: boolean
          show_savings: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          show_budgeting?: boolean
          show_loans?: boolean
          show_savings?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          show_budgeting?: boolean
          show_loans?: boolean
          show_savings?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          color: string | null
          created_at: string | null
          gradient: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string | null
          created_at?: string | null
          gradient?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          color?: string | null
          created_at?: string | null
          gradient?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
