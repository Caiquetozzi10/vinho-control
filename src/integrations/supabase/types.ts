export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      adegas: {
        Row: {
          ativo: boolean
          created_at: string
          data_ultimo_pagamento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          status_pagamento: Database["public"]["Enums"]["payment_status"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_ultimo_pagamento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          status_pagamento?: Database["public"]["Enums"]["payment_status"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_ultimo_pagamento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          status_pagamento?: Database["public"]["Enums"]["payment_status"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          acao: string
          adega_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          adega_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          adega_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_adega_id_fkey"
            columns: ["adega_id"]
            isOneToOne: false
            referencedRelation: "adegas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      itens_venda: {
        Row: {
          created_at: string
          id: string
          nome_produto: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_produto: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_produto?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          adega_id: string
          ativo: boolean
          categoria: Database["public"]["Enums"]["product_category"]
          codigo_barras: string | null
          created_at: string
          custo: number | null
          estoque_minimo: number
          foto_url: string | null
          id: string
          nome: string
          preco_venda: number
          quantidade_estoque: number
          updated_at: string
        }
        Insert: {
          adega_id: string
          ativo?: boolean
          categoria: Database["public"]["Enums"]["product_category"]
          codigo_barras?: string | null
          created_at?: string
          custo?: number | null
          estoque_minimo?: number
          foto_url?: string | null
          id?: string
          nome: string
          preco_venda: number
          quantidade_estoque?: number
          updated_at?: string
        }
        Update: {
          adega_id?: string
          ativo?: boolean
          categoria?: Database["public"]["Enums"]["product_category"]
          codigo_barras?: string | null
          created_at?: string
          custo?: number | null
          estoque_minimo?: number
          foto_url?: string | null
          id?: string
          nome?: string
          preco_venda?: number
          quantidade_estoque?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_adega_id_fkey"
            columns: ["adega_id"]
            isOneToOne: false
            referencedRelation: "adegas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          adega_id: string | null
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          adega_id?: string | null
          ativo?: boolean
          created_at?: string
          email: string
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          adega_id?: string | null
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_adega_id_fkey"
            columns: ["adega_id"]
            isOneToOne: false
            referencedRelation: "adegas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          adega_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          adega_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          adega_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_adega_id_fkey"
            columns: ["adega_id"]
            isOneToOne: false
            referencedRelation: "adegas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          adega_id: string
          created_at: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          usuario_id: string
          valor_total: number
        }
        Insert: {
          adega_id: string
          created_at?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          usuario_id: string
          valor_total?: number
        }
        Update: {
          adega_id?: string
          created_at?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          usuario_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_adega_id_fkey"
            columns: ["adega_id"]
            isOneToOne: false
            referencedRelation: "adegas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_adega_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_geral: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin_geral" | "gerente_adega" | "operador"
      payment_status: "ativo" | "aguardando" | "bloqueado"
      product_category:
        | "vinho"
        | "cerveja"
        | "bebida_quente"
        | "energetica"
        | "gelo"
        | "outros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin_geral", "gerente_adega", "operador"],
      payment_status: ["ativo", "aguardando", "bloqueado"],
      product_category: [
        "vinho",
        "cerveja",
        "bebida_quente",
        "energetica",
        "gelo",
        "outros",
      ],
    },
  },
} as const
