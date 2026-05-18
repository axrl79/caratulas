/**
 * ─────────────────────────────────────────────────────────────────────────
 * API Integration Service
 * Integración con las APIs de convenios-lake para guardar caratulas
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { FormData, Categoria } from "./diccionarios";

const API_BASE_URL = "https://convenios-lake.vercel.app";
const LOCAL_API = "/api/caratulas";

// ─────────────────────────────────────────────────────────────────────────
// TIPOS Y INTERFACES
// ─────────────────────────────────────────────────────────────────────────

export interface CategoriaPayload {
  code: string;
  nombre: string;
  descripcion?: string;
}

export interface RegistroPayload {
  titulo: string;
  categoria_code: string;
  interesado: string;
  ing_nombre: string;
  rni: string;
  coordenadas?: string;
  municipio?: string;
  zona?: string;
  calle?: string;
  niveles?: number;
  norma?: string;
  norma_verif?: string;
  norma_aplicacion?: string;
  superf_construir?: number;
  superf_terreno?: number;
  tiene_planos?: boolean;
  num_planos?: number;
  num_copias?: number;
  cod_hash?: string;          // ← SHA256 del documento como código de referencia
  sha256?: string;            // ← Hash SHA256 del documento
  hash?: string;              // ← alias extra para compatibilidad con API
  document_hash?: string;     // ← alias extra para compatibilidad con API
  documento_sha256?: string;  // ← alias extra para compatibilidad con API
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: string[];
  invalidFiles?: any[];
  suggestions?: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// MAPEO DE DATOS DEL FORMULARIO A API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Convierte FormData del sistema a RegistroPayload para la API
 */
export function mapFormDataToRegistro(
  formData: FormData,
  categoria: Categoria,
  sha256?: string
): RegistroPayload {
  // Parsear números con coma a punto
  const parseDecimal = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const str = String(val).replace(",", ".");
    const num = parseFloat(str);
    return isNaN(num) ? undefined : num;
  };

  // Parsear booleano
  const parseBoolean = (val: string | boolean | undefined): boolean | undefined => {
    if (val === undefined) return undefined;
    if (val === "true") return true;
    if (val === "false") return false;
    return val as boolean;
  };

  // Parsear entero
  const parseInteger = (val: string | undefined): number | undefined => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  };

  return {
    titulo: formData.titulo || "",
    categoria_code: categoria.code,
    interesado: formData.interesado || "",
    ing_nombre: formData.ingNombre || "",
    rni: formData.rni || "",
    coordenadas: formData.coordenadas,
    municipio: formData.municipio,
    zona: formData.zona,
    calle: formData.calle,
    niveles: parseInteger(formData.niveles as string),
    norma: formData.norma,
    norma_verif: formData.normaVerif,
    norma_aplicacion: formData.normaAplicacion,
    superf_construir: parseDecimal(formData.superfConstruir as string),
    superf_terreno: parseDecimal(formData.superfTerreno as string),
    tiene_planos: parseBoolean(formData.tienePlanos),
    num_planos: parseInteger(formData.numPlanos as string),
    num_copias: parseInteger(formData.numCopias as string),
    cod_hash: sha256,
    sha256: sha256,  // ← Hash SHA256 del documento
    hash: sha256,
    document_hash: sha256,
    documento_sha256: sha256,
  };
}

/**
 * Extrae código de disciplina del código de categoría
 * Ej: "PES1" → disciplina estructural, generar nombre descriptivo
 */
function generarNombreCategoria(categoria: Categoria): string {
  // Mapeo de categorías a nombres amigables para la API
  const nombreMap: Record<string, string> = {
    "PES1": "Proyecto Estructural - Edificación",
    "PES2": "Proyecto Estructural - Muro de Contención",
    "PES3": "Proyecto Estructural - Puente o Viaducto",
    "PES4": "Proyecto Estructural - Refuerzo",
    "PES5": "Proyecto Estructural - Otros",
    "CES1": "Certificado Estabilidad - Edificación",
    "CES2": "Certificado Estabilidad - Otros",
    "PSA1": "Proyecto Sanitario - Sistema Agua",
    "PSA2": "Proyecto Sanitario - Sistema Desague",
    "CSA1": "Proyecto Sanitario - Otros",
    "CSV1": "Certificado Validación Sanitaria",
    "EGG1": "Estudio Geotécnico - Básico",
    "EGG2": "Estudio Geotécnico - Completo",
    "PIE1": "Proyecto Instalación Eléctrica",
    "PEE1": "Peritaje Eléctrico",
    "PME1": "Proyecto Mecánico",
    "PPC1": "Plan de Contingencia",
    "INF1": "Informe Pericial",
  };

  return nombreMap[categoria.code] || categoria.label;
}

// ─────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Crea o obtiene una categoría en la API
 */
export async function enviarCategoria(categoria: Categoria): Promise<ApiResponse> {
  try {
    const payload: CategoriaPayload = {
      code: categoria.code,
      nombre: generarNombreCategoria(categoria),
      descripcion: categoria.label,
    };

    // Usar el proxy local en lugar de llamar directo a la API
    const response = await fetch(LOCAL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "crear-categoria",
        payload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn(
        `⚠️ Categoría posiblemente ya existe (${response.status}). Continuando...`
      );
      return { success: true, message: "Categoría ya existe o creada" };
    }

    return { success: true, data, message: "Categoría creada exitosamente" };
  } catch (error) {
    console.error("Error al enviar categoría:", error);
    return {
      success: false,
      error: `Error al enviar categoría: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Crea un registro (visado) en la API
 */
export async function enviarRegistro(
  formData: FormData,
  categoria: Categoria,
  sha256?: string
): Promise<ApiResponse<{ id: number; cod_hash: string }>> {
  try {
    // DEBUG
    console.log("🔍 enviarRegistro DEBUG:", {
      sha256: sha256,
      sha256_length: sha256?.length,
      sha256_type: typeof sha256,
    });

    const payload = mapFormDataToRegistro(formData, categoria, sha256);

    // DEBUG: mostrar exactamente qué se envía al proxy
    console.log("🔍 enviarRegistro payload:", payload);

    // Usar el proxy local en lugar de llamar directo a la API
    const response = await fetch(LOCAL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "crear-registro",
        payload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `Error al crear registro: ${data.error || response.statusText}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: "Registro creado exitosamente",
    };
  } catch (error) {
    console.error("Error al enviar registro:", error);
    return {
      success: false,
      error: `Error al enviar registro: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function enviarArchivos(
  registroId: number,
  files: File[],
  tipo: "PLANO" | "MEMORIA" | "INFORME" | "OTRO" = "PLANO"
): Promise<ApiResponse> {
  try {
    const MAX_FILES = 20; // Límite total de la carátula
    const MAX_SINGLE_SIZE_MB = 3.0; // Límite estricto para evitar Vercel 4.5MB con overhead
    const MAX_SINGLE_SIZE_BYTES = MAX_SINGLE_SIZE_MB * 1024 * 1024;
    const MAX_TOTAL_SIZE_MB = 300;
    const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

    const ALLOWED_EXTENSIONS = new Set([
      "pdf",
      "png",
      "jpg",
      "jpeg",
      "webp",
      "docx",
      "xlsx",
      "zip",
      "rar",
    ]);
    const INVALID_CHARS_REGEX = /[<>:"\/\\|?*\x00-\x1F\x7F]/;

    if (!files || files.length === 0) {
      return { success: true, message: "Sin archivos para subir" };
    }

    // 1. Validar cantidad máxima de archivos totales
    if (files.length > MAX_FILES) {
      return {
        success: false,
        error: `Excede la cantidad máxima de archivos permitidos por carga (Límite: ${MAX_FILES}, enviado: ${files.length}).`,
        code: "MAX_FILE_COUNT_EXCEEDED",
      };
    }

    // 2. Validar tamaño total, tamaño individual, formatos y caracteres
    let totalSize = 0;
    const oversizedFiles: string[] = [];
    const invalidFormatFiles: string[] = [];
    const invalidCharFiles: string[] = [];

    for (const file of files) {
      totalSize += file.size;

      if (file.size > MAX_SINGLE_SIZE_BYTES) {
        oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      }

      const parts = file.name.split(".");
      const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
      if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
        invalidFormatFiles.push(`${file.name} (.${ext || "sin extensión"})`);
      }

      if (INVALID_CHARS_REGEX.test(file.name)) {
        invalidCharFiles.push(file.name);
      }
    }

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return {
        success: false,
        error: `El tamaño total de la carga excede el límite de ${MAX_TOTAL_SIZE_MB} MB.`,
        code: "MAX_TOTAL_SIZE_EXCEEDED",
      };
    }

    if (oversizedFiles.length > 0) {
      return {
        success: false,
        error: `Uno o varios archivos exceden el tamaño máximo individual de ${MAX_SINGLE_SIZE_MB} MB permitido por Vercel.`,
        code: "MAX_SINGLE_SIZE_EXCEEDED",
        details: oversizedFiles,
        suggestions: [
          `💡 El límite seguro para subidas en la nube es de ${MAX_SINGLE_SIZE_MB}MB.`,
          "💡 Por favor, comprime tus archivos PDF o divídelos."
        ]
      };
    }

    if (invalidFormatFiles.length > 0) {
      return {
        success: false,
        error: `Formato de archivo no permitido.`,
        code: "INVALID_FILE_FORMAT",
        details: invalidFormatFiles,
      };
    }

    if (invalidCharFiles.length > 0) {
      return {
        success: false,
        error: `Los nombres de archivo contienen caracteres especiales inválidos.`,
        code: "INVALID_FILENAME_CHARS",
        details: invalidCharFiles,
      };
    }

    // 3. Validar nombres duplicados en la misma carga
    const fileNames = files.map((f) => f.name);
    const duplicates = fileNames.filter((name, idx) => fileNames.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      return {
        success: false,
        error: "Se detectaron nombres de archivo duplicados en la misma carga.",
        code: "DUPLICATE_FILES_IN_BATCH",
        details: Array.from(new Set(duplicates)),
      };
    }

    // 4. Batching Algorithm (Lotes Vercel-Safe)
    const BATCH_MAX_FILES = 3;
    const BATCH_MAX_SIZE_BYTES = 3.0 * 1024 * 1024; // 3.0MB limit to leave 1.5MB margin for FormData headers

    interface FileBatch {
      files: File[];
      size: number;
    }

    const batches: FileBatch[] = [];
    let currentBatch: FileBatch = { files: [], size: 0 };

    for (const file of files) {
      if (
        currentBatch.files.length >= BATCH_MAX_FILES ||
        currentBatch.size + file.size > BATCH_MAX_SIZE_BYTES
      ) {
        if (currentBatch.files.length > 0) {
          batches.push(currentBatch);
        }
        currentBatch = { files: [file], size: file.size };
      } else {
        currentBatch.files.push(file);
        currentBatch.size += file.size;
      }
    }
    if (currentBatch.files.length > 0) {
      batches.push(currentBatch);
    }

    // 5. Enviar lotes secuencialmente
    const allArchivosSubidos = [];
    const uploadSummary = { total_procesados: 0, exitosos: 0, fallidos: 0, tamanio_total: 0 };

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const formDataToProxy = new FormData();
      formDataToProxy.append("action", "subir-archivos");
      formDataToProxy.append("registro_id", String(registroId));
      formDataToProxy.append("tipo", tipo);

      batch.files.forEach((file) => {
        formDataToProxy.append("files", file, file.name);
      });

      console.log(`📤 Enviando lote ${i + 1}/${batches.length} con ${batch.files.length} archivos (${(batch.size / 1024 / 1024).toFixed(2)} MB)...`);

      const response = await fetch(LOCAL_API, {
        method: "POST",
        body: formDataToProxy,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || response.statusText || `Error al subir el lote ${i + 1}`,
          code: data.status === 413 ? "PAYLOAD_TOO_LARGE" : data.status === 429 ? "RATE_LIMIT_EXCEEDED" : data.code || "API_ERROR",
          details: data.details ? (Array.isArray(data.details) ? data.details : [data.details]) : [],
          invalidFiles: data.invalidFiles,
          suggestions: data.suggestions,
        };
      }

      if (data.data && data.data.archivos_subidos) {
        allArchivosSubidos.push(...data.data.archivos_subidos);
      }
      if (data.summary) {
        uploadSummary.total_procesados += data.summary.total_procesados || 0;
        uploadSummary.exitosos += data.summary.exitosos || 0;
        uploadSummary.fallidos += data.summary.fallidos || 0;
        uploadSummary.tamanio_total += data.summary.tamanio_total || 0;
      }
    }

    return { 
      success: true, 
      message: "Todos los lotes de archivos subidos exitosamente", 
      data: { archivos_subidos: allArchivosSubidos, summary: uploadSummary } 
    };
  } catch (error) {
    console.error("Error al subir archivos:", error);
    return {
      success: false,
      error: `Error al subir archivos: ${error instanceof Error ? error.message : String(error)}`,
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Flujo completo: Envía categoría → Registro → Archivos
 */
export async function enviarCaratulaCompleta(
  formData: FormData,
  categoria: Categoria,
  sha256?: string,
  pdfFile?: File,
  archivosAdicionales?: File[],
  existingRegistroId?: number
): Promise<ApiResponse<{ cod_hash?: string; registro_id?: number, archivos_subidos?: any[] }>> {
  try {
    console.log("📤 Iniciando envío de caratula completa...", { existingRegistroId });

    let registroId = existingRegistroId;
    let codHash = sha256;

    if (!registroId) {
      // 1. Enviar categoría
      console.log("1️⃣ Enviando categoría...");
      const catResult = await enviarCategoria(categoria);
      if (!catResult.success) {
        console.warn("⚠️ Advertencia al enviar categoría:", catResult.error);
      }

      // 2. Crear registro (con SHA256)
      console.log("2️⃣ Creando registro...");
      const regResult = await enviarRegistro(formData, categoria, sha256);
      if (!regResult.success) {
        return {
          success: false,
          error: `Error al crear registro: ${regResult.error}`,
        };
      }

      registroId = regResult.data?.id;
      codHash = regResult.data?.cod_hash;

      if (!registroId) {
        return { success: false, error: "No se obtuvo ID de registro" };
      }
    } else {
      console.log("⏭️ Usando registro existente:", registroId);
    }

    // 3. Subir archivos
    let finalArchivosSubidos: any[] = [];
    const archivosParaSubir: File[] = [];
    if (pdfFile) archivosParaSubir.push(pdfFile);
    if (archivosAdicionales) archivosParaSubir.push(...archivosAdicionales);

    if (archivosParaSubir.length > 0) {
      console.log("3️⃣ Subiendo archivos...");
      const filesResult = await enviarArchivos(registroId, archivosParaSubir, "PLANO");
      if (!filesResult.success) {
        console.warn("⚠️ Error al subir archivos:", filesResult.error);
        return {
          success: false,
          error: filesResult.error,
          code: filesResult.code,
          details: filesResult.details,
          invalidFiles: filesResult.invalidFiles,
          suggestions: filesResult.suggestions,
          data: { cod_hash: sha256 || codHash, registro_id: registroId, archivos_subidos: filesResult.data?.archivos_subidos || [] }
        } as any;
      }
      finalArchivosSubidos = filesResult.data?.archivos_subidos || [];
    }

    return {
      success: true,
      data: { cod_hash: sha256 || codHash, registro_id: registroId, archivos_subidos: finalArchivosSubidos },
      message: "Caratula enviada exitosamente a la base de datos",
    };
  } catch (error) {
    console.error("Error en envío completo:", error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Utilidad: Convierte un Blob a File
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}
