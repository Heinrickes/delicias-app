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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ajustes: {
        Row: {
          actualizado_en: string
          avisar_cobros: boolean
          avisar_entregas: boolean
          avisar_produccion: boolean
          avisar_stock: boolean
          dias_anticipacion: number
          id: number
          push_activado: boolean
        }
        Insert: {
          actualizado_en?: string
          avisar_cobros?: boolean
          avisar_entregas?: boolean
          avisar_produccion?: boolean
          avisar_stock?: boolean
          dias_anticipacion?: number
          id?: number
          push_activado?: boolean
        }
        Update: {
          actualizado_en?: string
          avisar_cobros?: boolean
          avisar_entregas?: boolean
          avisar_produccion?: boolean
          avisar_stock?: boolean
          dias_anticipacion?: number
          id?: number
          push_activado?: boolean
        }
        Relationships: []
      }
      categorias: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre: string
          orden?: number
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          creado_en: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
        }
        Insert: {
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
        }
        Update: {
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      compras: {
        Row: {
          creado_en: string | null
          estado: string
          fecha_completada: string | null
          fecha_planificada: string | null
          id: string
          items: Json
          notas: string | null
          proveedor: string | null
          total: number
        }
        Insert: {
          creado_en?: string | null
          estado?: string
          fecha_completada?: string | null
          fecha_planificada?: string | null
          id?: string
          items?: Json
          notas?: string | null
          proveedor?: string | null
          total?: number
        }
        Update: {
          creado_en?: string | null
          estado?: string
          fecha_completada?: string | null
          fecha_planificada?: string | null
          id?: string
          items?: Json
          notas?: string | null
          proveedor?: string | null
          total?: number
        }
        Relationships: []
      }
      compras_planificadas: {
        Row: {
          creado_en: string | null
          descripcion: string
          estado: string | null
          fecha_plan: string
          id: string
          notas: string | null
          proveedor: string | null
        }
        Insert: {
          creado_en?: string | null
          descripcion: string
          estado?: string | null
          fecha_plan: string
          id?: string
          notas?: string | null
          proveedor?: string | null
        }
        Update: {
          creado_en?: string | null
          descripcion?: string
          estado?: string | null
          fecha_plan?: string
          id?: string
          notas?: string | null
          proveedor?: string | null
        }
        Relationships: []
      }
      insumos: {
        Row: {
          activo: boolean
          costo_unitario: number
          creado_en: string
          en_lista: boolean
          id: string
          nombre: string
          proveedor: string | null
          stock: number
          stock_minimo: number
          unidad: string
        }
        Insert: {
          activo?: boolean
          costo_unitario?: number
          creado_en?: string
          en_lista?: boolean
          id?: string
          nombre: string
          proveedor?: string | null
          stock?: number
          stock_minimo?: number
          unidad?: string
        }
        Update: {
          activo?: boolean
          costo_unitario?: number
          creado_en?: string
          en_lista?: boolean
          id?: string
          nombre?: string
          proveedor?: string | null
          stock?: number
          stock_minimo?: number
          unidad?: string
        }
        Relationships: []
      }
      movimientos_stock: {
        Row: {
          cantidad: number
          fecha: string
          id: string
          nota: string | null
          producto_id: string | null
          tipo: string
        }
        Insert: {
          cantidad: number
          fecha?: string
          id?: string
          nota?: string | null
          producto_id?: string | null
          tipo: string
        }
        Update: {
          cantidad?: number
          fecha?: string
          id?: string
          nota?: string | null
          producto_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_items: {
        Row: {
          cantidad: number
          id: string
          pack_id: string
          producto_id: string
        }
        Insert: {
          cantidad?: number
          id?: string
          pack_id: string
          producto_id: string
        }
        Update: {
          cantidad?: number
          id?: string
          pack_id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          cantidad: number
          id: string
          nombre_producto: string
          pedido_id: string
          precio_unitario: number
          producto_id: string | null
          subtotal: number
        }
        Insert: {
          cantidad?: number
          id?: string
          nombre_producto: string
          pedido_id: string
          precio_unitario?: number
          producto_id?: string | null
          subtotal?: number
        }
        Update: {
          cantidad?: number
          id?: string
          nombre_producto?: string
          pedido_id?: string
          precio_unitario?: number
          producto_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          creado_en: string
          estado: string
          fecha_entrega: string | null
          fecha_estimada_pago: string | null
          fecha_pedido: string
          id: string
          notas: string | null
          total: number
        }
        Insert: {
          cliente_id?: string | null
          creado_en?: string
          estado?: string
          fecha_entrega?: string | null
          fecha_estimada_pago?: string | null
          fecha_pedido?: string
          id?: string
          notas?: string | null
          total?: number
        }
        Update: {
          cliente_id?: string | null
          creado_en?: string
          estado?: string
          fecha_entrega?: string | null
          fecha_estimada_pago?: string | null
          fecha_pedido?: string
          id?: string
          notas?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      producciones: {
        Row: {
          cantidad: number
          creado_en: string
          estado: string
          fecha_plan: string
          id: string
          nota: string | null
          producto_id: string
        }
        Insert: {
          cantidad: number
          creado_en?: string
          estado?: string
          fecha_plan: string
          id?: string
          nota?: string | null
          producto_id: string
        }
        Update: {
          cantidad?: number
          creado_en?: string
          estado?: string
          fecha_plan?: string
          id?: string
          nota?: string | null
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producciones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          categoria_id: string | null
          costo: number
          creado_en: string
          id: string
          imagen_url: string | null
          nombre: string
          precio: number
          stock: number
          stock_minimo: number
          tipo: string
          unidad: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          costo?: number
          creado_en?: string
          id?: string
          imagen_url?: string | null
          nombre: string
          precio: number
          stock?: number
          stock_minimo?: number
          tipo?: string
          unidad?: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          costo?: number
          creado_en?: string
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio?: number
          stock?: number
          stock_minimo?: number
          tipo?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          creado_en: string
          endpoint: string
          id: string
          p256dh: string
        }
        Insert: {
          auth: string
          creado_en?: string
          endpoint: string
          id?: string
          p256dh: string
        }
        Update: {
          auth?: string
          creado_en?: string
          endpoint?: string
          id?: string
          p256dh?: string
        }
        Relationships: []
      }
      ventas: {
        Row: {
          cantidad: number
          cliente_id: string | null
          costo_total: number
          fecha: string
          id: string
          nombre_producto: string
          pedido_id: string | null
          producto_id: string | null
          total: number
        }
        Insert: {
          cantidad?: number
          cliente_id?: string | null
          costo_total?: number
          fecha?: string
          id?: string
          nombre_producto: string
          pedido_id?: string | null
          producto_id?: string | null
          total: number
        }
        Update: {
          cantidad?: number
          cliente_id?: string | null
          costo_total?: number
          fecha?: string
          id?: string
          nombre_producto?: string
          pedido_id?: string | null
          producto_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _descontar_stock: {
        Args: { p_cantidad: number; p_nota: string; p_producto_id: string }
        Returns: number
      }
      _reponer_stock: {
        Args: { p_cantidad: number; p_nota: string; p_producto_id: string }
        Returns: undefined
      }
      cambiar_estado_pedido: {
        Args: { p_estado: string; p_fecha_pago: string; p_id: string }
        Returns: undefined
      }
      confirmar_produccion: { Args: { p_id: string }; Returns: undefined }
      crear_venta: {
        Args: {
          p_cliente_id: string
          p_estado: string
          p_fecha_entrega: string
          p_fecha_pago: string
          p_items: Json
          p_notas: string
        }
        Returns: string
      }
      eliminar_pedido: { Args: { p_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
