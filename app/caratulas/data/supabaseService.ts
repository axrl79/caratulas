// ─────────────────────────────────────────────────────────────────────────
// supabaseService.ts
// Servicio para guardar documentos y metadatos en Supabase
// ─────────────────────────────────────────────────────────────────────────

/**
 * CONFIGURACIÓN REQUERIDA EN TU .env.local:
 * 
 * NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
 */

import { DocumentRecord, DocumentMetadata } from "./documentHelper";

// Tipos para respuestas de Supabase
interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface DocumentStorageResult {
  success: boolean;
  documentId?: string;
  fileUrls?: Record<string, string>;
  error?: string;
}

/**
 * Clase para manejar operaciones con Supabase
 * NOTA: Requiere que crees las tablas en Supabase primero
 */
export class SupabaseDocumentService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn("⚠️ Variables de Supabase no configuradas. Revisar .env.local");
    }
  }

  /**
   * TABLA 1: "documentos" - Metadata del trámite
   * Estructura SQL:
   * 
   * CREATE TABLE documentos (
   *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   *   sha256 TEXT UNIQUE NOT NULL,
   *   codigo TEXT NOT NULL,
   *   titulo TEXT,
   *   municipio TEXT,
   *   metadata JSONB,
   *   form_data JSONB,
   *   created_at TIMESTAMP DEFAULT NOW(),
   *   updated_at TIMESTAMP DEFAULT NOW()
   * );
   */
  async saveDocumentMetadata(
    sha256: string,
    metadata: DocumentMetadata,
    formData: any,
    catCode: string
  ): Promise<SupabaseResponse<any>> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/documentos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: this.supabaseKey,
          },
          body: JSON.stringify({
            sha256,
            codigo: catCode,
            titulo: metadata.titulo,
            municipio: metadata.municipio,
            metadata,
            form_data: formData,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: { message: error.message || "Error al guardar metadata" } };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  /**
   * TABLA 2: "documentos_archivos" - Archivos asociados al trámite
   * Estructura SQL:
   * 
   * CREATE TABLE documentos_archivos (
   *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   *   documento_sha256 TEXT REFERENCES documentos(sha256) ON DELETE CASCADE,
   *   tipo TEXT NOT NULL, -- 'memorias', 'planos', 'planos_arq', 'caratula'
   *   nombre_archivo TEXT NOT NULL,
   *   tamano_bytes INTEGER,
   *   url_storage TEXT,
   *   uploaded_at TIMESTAMP DEFAULT NOW()
   * );
   */
  async uploadDocumentFile(
    sha256: string,
    docType: "memorias" | "planos" | "planos_arq" | "caratula",
    file: File
  ): Promise<DocumentStorageResult> {
    try {
      // 1. Subir archivo a Supabase Storage
      const storagePath = `documents/${sha256}/${docType}/${file.name}`;
      const fileData = await file.arrayBuffer();

      const storageResponse = await fetch(
        `${this.supabaseUrl}/storage/v1/object/documents/${sha256}/${docType}/${file.name}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: this.supabaseKey,
          },
          body: fileData,
        }
      );

      if (!storageResponse.ok) {
        return {
          success: false,
          error: `Error al subir archivo a storage: ${storageResponse.statusText}`,
        };
      }

      const storageUrl = `${this.supabaseUrl}/storage/v1/object/public/documents/${sha256}/${docType}/${file.name}`;

      // 2. Registrar en tabla documentos_archivos
      const dbResponse = await fetch(
        `${this.supabaseUrl}/rest/v1/documentos_archivos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: this.supabaseKey,
          },
          body: JSON.stringify({
            documento_sha256: sha256,
            tipo: docType,
            nombre_archivo: file.name,
            tamano_bytes: file.size,
            url_storage: storageUrl,
          }),
        }
      );

      if (!dbResponse.ok) {
        return {
          success: false,
          error: "Error al registrar archivo en BD",
        };
      }

      return {
        success: true,
        fileUrls: { [docType]: storageUrl },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener todos los archivos de un documento por SHA256
   * (Para tu otra web que busca por ID)
   */
  async getDocumentFiles(sha256: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/documentos_archivos?documento_sha256=eq.${sha256}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: this.supabaseKey,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al obtener archivos:", error);
      return [];
    }
  }

  /**
   * Obtener documento completo por SHA256
   * (Para tu otra web)
   */
  async getDocumentBySHA256(sha256: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/documentos?sha256=eq.${sha256}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: this.supabaseKey,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      console.error("Error al obtener documento:", error);
      return null;
    }
  }

  /**
   * Buscar documentos por municipio o título
   */
  async searchDocuments(query: string, field: "municipio" | "titulo" = "municipio"): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/documentos?${field}=ilike.%${query}%`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: this.supabaseKey,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al buscar documentos:", error);
      return [];
    }
  }
}

// Instancia global
export const supabaseService = new SupabaseDocumentService();