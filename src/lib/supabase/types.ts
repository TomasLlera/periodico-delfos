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
      autores: {
        Row: {
          bio: string | null
          firma_como: string | null
          foto_url: string | null
          id: string
          instagram: string | null
          nombre: string
          slug: string
          x_handle: string | null
        }
        Insert: {
          bio?: string | null
          firma_como?: string | null
          foto_url?: string | null
          id: string
          instagram?: string | null
          nombre: string
          slug: string
          x_handle?: string | null
        }
        Update: {
          bio?: string | null
          firma_como?: string | null
          foto_url?: string | null
          id?: string
          instagram?: string | null
          nombre?: string
          slug?: string
          x_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autores_firma_como_fkey"
            columns: ["firma_como"]
            isOneToOne: false
            referencedRelation: "autores"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          apodo: string | null
          ciudad: string | null
          es_aldosivi: boolean
          escudo_url: string | null
          id: string
          nombre: string
          nombre_corto: string
          slug: string
        }
        Insert: {
          apodo?: string | null
          ciudad?: string | null
          es_aldosivi?: boolean
          escudo_url?: string | null
          id?: string
          nombre: string
          nombre_corto: string
          slug: string
        }
        Update: {
          apodo?: string | null
          ciudad?: string | null
          es_aldosivi?: boolean
          escudo_url?: string | null
          id?: string
          nombre?: string
          nombre_corto?: string
          slug?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          adicionado: number
          detalle: string | null
          equipo_id: string
          id: string
          jugadora_id: string | null
          jugadora_nombre: string | null
          jugadora_sale_id: string | null
          jugadora_sale_nombre: string | null
          minuto: number
          partido_id: string
          tipo: Database["public"]["Enums"]["tipo_evento_t"]
        }
        Insert: {
          adicionado?: number
          detalle?: string | null
          equipo_id: string
          id?: string
          jugadora_id?: string | null
          jugadora_nombre?: string | null
          jugadora_sale_id?: string | null
          jugadora_sale_nombre?: string | null
          minuto: number
          partido_id: string
          tipo: Database["public"]["Enums"]["tipo_evento_t"]
        }
        Update: {
          adicionado?: number
          detalle?: string | null
          equipo_id?: string
          id?: string
          jugadora_id?: string | null
          jugadora_nombre?: string | null
          jugadora_sale_id?: string | null
          jugadora_sale_nombre?: string | null
          minuto?: number
          partido_id?: string
          tipo?: Database["public"]["Enums"]["tipo_evento_t"]
        }
        Relationships: [
          {
            foreignKeyName: "eventos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_jugadora_id_fkey"
            columns: ["jugadora_id"]
            isOneToOne: false
            referencedRelation: "jugadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_jugadora_sale_id_fkey"
            columns: ["jugadora_sale_id"]
            isOneToOne: false
            referencedRelation: "jugadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
        ]
      }
      formaciones: {
        Row: {
          dorsal: number | null
          es_titular: boolean
          jugadora_id: string
          partido_id: string
          posicion: Database["public"]["Enums"]["posicion_t"] | null
        }
        Insert: {
          dorsal?: number | null
          es_titular?: boolean
          jugadora_id: string
          partido_id: string
          posicion?: Database["public"]["Enums"]["posicion_t"] | null
        }
        Update: {
          dorsal?: number | null
          es_titular?: boolean
          jugadora_id?: string
          partido_id?: string
          posicion?: Database["public"]["Enums"]["posicion_t"] | null
        }
        Relationships: [
          {
            foreignKeyName: "formaciones_jugadora_id_fkey"
            columns: ["jugadora_id"]
            isOneToOne: false
            referencedRelation: "jugadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formaciones_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
        ]
      }
      jugadoras: {
        Row: {
          activa: boolean
          apellido: string
          bio: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          lugar_origen: string | null
          nombre: string
          posicion: Database["public"]["Enums"]["posicion_t"]
          slug: string
        }
        Insert: {
          activa?: boolean
          apellido: string
          bio?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          lugar_origen?: string | null
          nombre: string
          posicion: Database["public"]["Enums"]["posicion_t"]
          slug: string
        }
        Update: {
          activa?: boolean
          apellido?: string
          bio?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          lugar_origen?: string | null
          nombre?: string
          posicion?: Database["public"]["Enums"]["posicion_t"]
          slug?: string
        }
        Relationships: []
      }
      notas: {
        Row: {
          auto_post: boolean
          autor_id: string
          bajada: string
          busqueda: unknown
          categoria: Database["public"]["Enums"]["categoria_t"]
          created_at: string
          cuerpo: Json
          destacada: boolean
          estado: Database["public"]["Enums"]["estado_nota_t"]
          id: string
          imagen_alt: string
          imagen_credito: string | null
          imagen_portada: string | null
          partido_id: string | null
          publicada_en: string | null
          redes: string[]
          slug: string
          temporada_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          auto_post?: boolean
          autor_id: string
          bajada: string
          busqueda?: unknown
          categoria: Database["public"]["Enums"]["categoria_t"]
          created_at?: string
          cuerpo: Json
          destacada?: boolean
          estado?: Database["public"]["Enums"]["estado_nota_t"]
          id?: string
          imagen_alt?: string
          imagen_credito?: string | null
          imagen_portada?: string | null
          partido_id?: string | null
          publicada_en?: string | null
          redes?: string[]
          slug: string
          temporada_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          auto_post?: boolean
          autor_id?: string
          bajada?: string
          busqueda?: unknown
          categoria?: Database["public"]["Enums"]["categoria_t"]
          created_at?: string
          cuerpo?: Json
          destacada?: boolean
          estado?: Database["public"]["Enums"]["estado_nota_t"]
          id?: string
          imagen_alt?: string
          imagen_credito?: string | null
          imagen_portada?: string | null
          partido_id?: string | null
          publicada_en?: string | null
          redes?: string[]
          slug?: string
          temporada_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "autores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      partidos: {
        Row: {
          arbitra: string | null
          cancha: string | null
          created_at: string
          equipo_local_id: string
          equipo_visitante_id: string
          estado: Database["public"]["Enums"]["estado_partido_t"]
          fecha_hora: string
          fecha_numero: number | null
          goles_local: number | null
          goles_visitante: number | null
          id: string
          observaciones: string | null
          slug: string
          temporada_id: string
        }
        Insert: {
          arbitra?: string | null
          cancha?: string | null
          created_at?: string
          equipo_local_id: string
          equipo_visitante_id: string
          estado?: Database["public"]["Enums"]["estado_partido_t"]
          fecha_hora: string
          fecha_numero?: number | null
          goles_local?: number | null
          goles_visitante?: number | null
          id?: string
          observaciones?: string | null
          slug: string
          temporada_id: string
        }
        Update: {
          arbitra?: string | null
          cancha?: string | null
          created_at?: string
          equipo_local_id?: string
          equipo_visitante_id?: string
          estado?: Database["public"]["Enums"]["estado_partido_t"]
          fecha_hora?: string
          fecha_numero?: number | null
          goles_local?: number | null
          goles_visitante?: number | null
          id?: string
          observaciones?: string | null
          slug?: string
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partidos_equipo_local_id_fkey"
            columns: ["equipo_local_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_equipo_visitante_id_fkey"
            columns: ["equipo_visitante_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      plantel: {
        Row: {
          capitana: boolean
          dorsal: number | null
          jugadora_id: string
          posicion: Database["public"]["Enums"]["posicion_t"] | null
          temporada_id: string
        }
        Insert: {
          capitana?: boolean
          dorsal?: number | null
          jugadora_id: string
          posicion?: Database["public"]["Enums"]["posicion_t"] | null
          temporada_id: string
        }
        Update: {
          capitana?: boolean
          dorsal?: number | null
          jugadora_id?: string
          posicion?: Database["public"]["Enums"]["posicion_t"] | null
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plantel_jugadora_id_fkey"
            columns: ["jugadora_id"]
            isOneToOne: false
            referencedRelation: "jugadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantel_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          external_post_id: string | null
          external_url: string | null
          id: string
          nota_id: string
          nota_slug: string
          platform: Database["public"]["Enums"]["social_platform"]
          status: Database["public"]["Enums"]["social_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          nota_id: string
          nota_slug: string
          platform: Database["public"]["Enums"]["social_platform"]
          status?: Database["public"]["Enums"]["social_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          nota_id?: string
          nota_slug?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          status?: Database["public"]["Enums"]["social_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas"
            referencedColumns: ["id"]
          },
        ]
      }
      tabla_posiciones: {
        Row: {
          empatados: number
          equipo_id: string
          fecha_numero: number
          ganados: number
          goles_contra: number
          goles_favor: number
          id: string
          jugados: number
          perdidos: number
          posicion: number
          puntos: number
          temporada_id: string
        }
        Insert: {
          empatados: number
          equipo_id: string
          fecha_numero: number
          ganados: number
          goles_contra: number
          goles_favor: number
          id?: string
          jugados: number
          perdidos: number
          posicion: number
          puntos: number
          temporada_id: string
        }
        Update: {
          empatados?: number
          equipo_id?: string
          fecha_numero?: number
          ganados?: number
          goles_contra?: number
          goles_favor?: number
          id?: string
          jugados?: number
          perdidos?: number
          posicion?: number
          puntos?: number
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabla_posiciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabla_posiciones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      temporadas: {
        Row: {
          activa: boolean
          anio: number
          created_at: string
          division: string
          id: string
          nombre: string
          slug: string
          zona: string | null
        }
        Insert: {
          activa?: boolean
          anio: number
          created_at?: string
          division: string
          id?: string
          nombre: string
          slug: string
          zona?: string | null
        }
        Update: {
          activa?: boolean
          anio?: number
          created_at?: string
          division?: string
          id?: string
          nombre?: string
          slug?: string
          zona?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      estadisticas_jugadora: {
        Row: {
          amarillas: number | null
          goles: number | null
          jugadora_id: string | null
          partidos: number | null
          rojas: number | null
          temporada_id: string | null
          titular: number | null
        }
        Relationships: [
          {
            foreignKeyName: "formaciones_jugadora_id_fkey"
            columns: ["jugadora_id"]
            isOneToOne: false
            referencedRelation: "jugadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      goleadoras: {
        Row: {
          apellido: string | null
          de_penal: number | null
          foto_url: string | null
          goles: number | null
          jugadora_id: string | null
          nombre: string | null
          slug: string | null
          temporada_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_jugadora_id_fkey"
            columns: ["jugadora_id"]
            isOneToOne: false
            referencedRelation: "jugadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partidos_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      buscar_notas: {
        Args: { limite?: number; termino: string }
        Returns: {
          bajada: string
          categoria: Database["public"]["Enums"]["categoria_t"]
          id: string
          publicada_en: string
          rank: number
          slug: string
          titulo: string
        }[]
      }
      es_autor: { Args: never; Returns: boolean }
    }
    Enums: {
      categoria_t:
        | "cronica"
        | "analisis"
        | "temporada"
        | "plantel"
        | "institucional"
      estado_nota_t: "borrador" | "publicada" | "archivada"
      estado_partido_t:
        | "programado"
        | "en_curso"
        | "finalizado"
        | "suspendido"
        | "postergado"
      posicion_t:
        | "arquera"
        | "defensora"
        | "mediocampista"
        | "delantera"
        | "dt"
        | "ayudante"
      social_platform: "facebook" | "instagram" | "x"
      social_status: "pending" | "processing" | "success" | "failed"
      tipo_evento_t:
        | "gol"
        | "gol_penal"
        | "gol_en_contra"
        | "penal_errado"
        | "amarilla"
        | "roja"
        | "doble_amarilla"
        | "cambio"
        | "lesion"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      categoria_t: [
        "cronica",
        "analisis",
        "temporada",
        "plantel",
        "institucional",
      ],
      estado_nota_t: ["borrador", "publicada", "archivada"],
      estado_partido_t: [
        "programado",
        "en_curso",
        "finalizado",
        "suspendido",
        "postergado",
      ],
      posicion_t: [
        "arquera",
        "defensora",
        "mediocampista",
        "delantera",
        "dt",
        "ayudante",
      ],
      social_platform: ["facebook", "instagram", "x"],
      social_status: ["pending", "processing", "success", "failed"],
      tipo_evento_t: [
        "gol",
        "gol_penal",
        "gol_en_contra",
        "penal_errado",
        "amarilla",
        "roja",
        "doble_amarilla",
        "cambio",
        "lesion",
      ],
    },
  },
} as const
