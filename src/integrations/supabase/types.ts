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
      asset_value_history: {
        Row: {
          asset_id: string
          created_at: string | null
          date: string
          id: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          date?: string
          id?: string
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          date?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_value_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: string
          created_at: string | null
          current_value: number
          id: string
          initial_value: number
          name: string
          purchase_date: string | null
          purchase_year: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          current_value: number
          id?: string
          initial_value: number
          name: string
          purchase_date?: string | null
          purchase_year?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          current_value?: number
          id?: string
          initial_value?: number
          name?: string
          purchase_date?: string | null
          purchase_year?: number | null
          updated_at?: string | null
          user_id?: string
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
          end_date: string | null
          id: string
          period: string
          period_display: string | null
          source_id: string | null
          source_percentage: number | null
          spent: number | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          amount: number
          category: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          period: string
          period_display?: string | null
          source_id?: string | null
          source_percentage?: number | null
          spent?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          amount?: number
          category?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          period?: string
          period_display?: string | null
          source_id?: string | null
          source_percentage?: number | null
          spent?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "budget_sources"
            referencedColumns: ["id"]
          },
        ]
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
          lender: string | null
          paid_amount: number | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
          wallet_id: string | null
          wallet_name: string | null
        }
        Insert: {
          amount: number
          borrower?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          lender?: string | null
          paid_amount?: number | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
          wallet_id?: string | null
          wallet_name?: string | null
        }
        Update: {
          amount?: number
          borrower?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          lender?: string | null
          paid_amount?: number | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          wallet_id?: string | null
          wallet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          loan_id: string
          payment_date: string
          updated_at: string | null
          user_id: string
          wallet_id: string
          wallet_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          loan_id: string
          payment_date: string
          updated_at?: string | null
          user_id: string
          wallet_id: string
          wallet_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          loan_id?: string
          payment_date?: string
          updated_at?: string | null
          user_id?: string
          wallet_id?: string
          wallet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
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
          amount: number
          created_at: string | null
          date: string
          id: string
          notes: string | null
          savings_id: string
          type: string
          updated_at: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          savings_id: string
          type: string
          updated_at?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          savings_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_savings_id_fkey"
            columns: ["savings_id"]
            isOneToOne: false
            referencedRelation: "savings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
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
          is_adjustment: boolean | null
          is_deleted: boolean | null
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
          is_adjustment?: boolean | null
          is_deleted?: boolean | null
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
          is_adjustment?: boolean | null
          is_deleted?: boolean | null
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
      wallet_history: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          change_amount: number
          created_at: string | null
          description: string | null
          id: string
          new_balance: number | null
          previous_balance: number | null
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          change_amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          new_balance?: number | null
          previous_balance?: number | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          change_amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          new_balance?: number | null
          previous_balance?: number | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_history_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number | null
          created_at: string | null
          description: string | null
          id: string
          source_id: string | null
          source_type: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          color: string | null
          created_at: string | null
          gradient: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
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
          logo_url?: string | null
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
          logo_url?: string | null
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
      adjust_wallet_balance: {
        Args: { wallet_id_param: string; adjustment_param: number }
        Returns: boolean
      }
      delete_loan_with_transactions: {
        Args: { loan_id_param: string }
        Returns: boolean
      }
      update_wallet_balance_directly: {
        Args: { wallet_id_param: string; new_balance_param: number }
        Returns: boolean
      }
      update_wallet_with_log: {
        Args: {
          wallet_id_param: string
          amount_param: number
          description_param: string
        }
        Returns: boolean
      }
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
