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
      users: {
        Row: {
          id: number
          username: string
          password: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          username: string
          password: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: number | null
          checkout_request_id: string
          phone_number: string
          amount: number
          account_reference: string
          transaction_desc: string | null
          status: string
          mpesa_receipt_number: string | null
          transaction_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: number | null
          checkout_request_id: string
          phone_number: string
          amount: number
          account_reference: string
          transaction_desc?: string | null
          status?: string
          mpesa_receipt_number?: string | null
          transaction_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: number | null
          checkout_request_id?: string
          phone_number?: string
          amount?: number
          account_reference?: string
          transaction_desc?: string | null
          status?: string
          mpesa_receipt_number?: string | null
          transaction_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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