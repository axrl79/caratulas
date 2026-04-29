// ─────────────────────────────────────────────────────────────────────────
// documentHelper.ts
// Utilidades para generar SHA256, QR y manejar documentos
// ─────────────────────────────────────────────────────────────────────────

import QRCode from "qrcode";
import { FormData, Categoria } from "./diccionarios";

/**
 * Estructura del documento único con SHA256 + metadatos
 */
export interface DocumentMetadata {
  id: string; // SHA256 hash
  code: string; // Código categoría (PES1, PSA2, etc.)
  timestamp: string; // ISO timestamp
  titulo: string;
  municipio: string;
  version: string;
}

/**
 * Genera SHA256 a partir de datos del formulario
 * Garantiza unicidad por: título + municipio + coordenadas + timestamp
 */
export async function generateDocumentSHA256(
  formData: FormData,
  cat: Categoria,
  timestamp?: string
): Promise<string> {
  const data = {
    titulo: formData.titulo || "",
    municipio: formData.municipio || "",
    coordenadas: formData.coordenadas || "",
    code: cat.code,
    timestamp: timestamp ?? new Date().toISOString(),
  };

  const jsonString = JSON.stringify(data);
  const msgUint8 = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

/**
 * Crea metadatos completos del documento
 */
export function createDocumentMetadata(
  sha256: string,
  formData: FormData,
  cat: Categoria,
  timestamp?: string
): DocumentMetadata {
  return {
    id: sha256,
    code: cat.code,
    timestamp: timestamp ?? new Date().toISOString(),
    titulo: formData.titulo || "Sin título",
    municipio: formData.municipio || "Sin ubicación",
    version: "1.0",
  };
}

/**
 * Genera QR a partir de los metadatos del documento
 * El QR contendrá un JSON que permitirá búsquedas en tu otra web
 */
export async function generateDocumentQR(
  metadata: DocumentMetadata
): Promise<string> {
  const qrData = JSON.stringify(metadata);

  const qrDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: {
      dark: "#0f2419",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H", // Alto nivel de corrección
  });

  return qrDataUrl;
}

/**
 * Genera nombre de archivo para descarga
 * Formato: SHA256_PRIMEROS_8_DIGITOS_TIMESTAMP
 */
export function generateFileName(
  sha256: string,
  cat: Categoria,
  titulo: string
): string {
  const shortHash = sha256.substring(0, 8).toUpperCase();
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const cleanTitulo = titulo
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .substring(0, 20);

  return `${shortHash}_${cat.code}_${timestamp}_${cleanTitulo}.pdf`;
}

/**
 * Prepara archivo para carga
 * Valida tamaño (máx 50MB)
 */
export async function validateFile(
  file: File,
  maxSizeMB: number = 50
): Promise<{ valid: boolean; error?: string }> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `El archivo "${file.name}" excede ${maxSizeMB}MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Lee archivo como base64 para almacenamiento
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extraer solo la parte base64 (sin data:application/pdf;base64,)
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Estructura de documento para almacenar en BD
 */
export interface DocumentRecord {
  id: string; // SHA256
  metadata: DocumentMetadata;
  formData: FormData;
  categoria: Categoria;
  archivos: {
    memorias?: { name: string; size: number; base64: string; uploadedAt: string };
    planos?: { name: string; size: number; base64: string; uploadedAt: string };
    planosArq?: { name: string; size: number; base64: string; uploadedAt: string };
  };
  caratulaPDF?: { name: string; size: number; base64: string; uploadedAt: string };
  createdAt: string;
  updatedAt: string;
}