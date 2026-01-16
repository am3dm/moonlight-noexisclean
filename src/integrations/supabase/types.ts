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
      products: {
        Row: {
          id: string
          name: string
          description?: string | null
          sku?: string | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          price_retail?: number
          price_wholesale?: number
          stock_qty?: number
          min_stock_qty?: number
          product_type?: string
          created_at?: string
          updated_at?: string
          // Legacy fields for compatibility
          cost?: number
          price?: number
          quantity?: number
          min_quantity?: number
          unit?: string
          categories?: { name: string; color: string | null } | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sku?: string | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          price_retail?: number
          price_wholesale?: number
          stock_qty?: number
          min_stock_qty?: number
          product_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sku?: string | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          price_retail?: number
          price_wholesale?: number
          stock_qty?: number
          min_stock_qty?: number
          product_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          credit_limit?: number
          current_balance?: number
          balance?: number | null
          total_purchases?: number | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          credit_limit?: number
          current_balance?: number
          balance?: number | null
          total_purchases?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          credit_limit?: number
          current_balance?: number
          balance?: number | null
          total_purchases?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          type: string
          customer_id?: string | null
          supplier_id?: string | null
          subtotal: number
          discount?: number
          tax?: number
          total: number
          paid?: number
          remaining?: number
          status?: string
          payment_method?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          customers?: { name: string } | null
          suppliers?: { name: string } | null
        }
        Insert: {
          id?: string
          invoice_number: string
          type: string
          customer_id?: string | null
          supplier_id?: string | null
          subtotal: number
          discount?: number
          tax?: number
          total: number
          paid?: number
          remaining?: number
          status?: string
          payment_method?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          type?: string
          customer_id?: string | null
          supplier_id?: string | null
          subtotal?: number
          discount?: number
          tax?: number
          total?: number
          paid?: number
          remaining?: number
          status?: string
          payment_method?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
          discount?: number
          total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
          discount?: number
          total: number
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          price?: number
          discount?: number
          total?: number
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: string
          store_name?: string | null
          store_phone?: string | null
          store_email?: string | null
          store_address?: string | null
          logo_url?: string | null
          currency?: string | null
          tax_rate?: number | null
          invoice_prefix?: string | null
          language?: string | null
          is_setup_completed?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          store_name?: string | null
          store_phone?: string | null
          store_email?: string | null
          store_address?: string | null
          logo_url?: string | null
          currency?: string | null
          tax_rate?: number | null
          invoice_prefix?: string | null
          language?: string | null
          is_setup_completed?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string | null
          store_phone?: string | null
          store_email?: string | null
          store_address?: string | null
          logo_url?: string | null
          currency?: string | null
          tax_rate?: number | null
          invoice_prefix?: string | null
          language?: string | null
          is_setup_completed?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          balance?: number | null
          total_purchases?: number | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          balance?: number | null
          total_purchases?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          balance?: number | null
          total_purchases?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id?: string | null
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          user_id: string
          full_name?: string | null
          role?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          role?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          role?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
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