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
    "PSA3": "Proyecto Sanitario - Otros",
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

/**
 * Sube archivos a un registro
 */
export async function enviarArchivos(
  registroId: number,
  files: File[],
  tipo: "PLANO" | "MEMORIA" | "INFORME" | "OTRO" = "PLANO"
): Promise<ApiResponse> {
  try {
    const MAX_FILES_PER_REQUEST = 5;
    const MAX_FILE_SIZE_MB = 20;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const ALLOWED_MIME = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);

    if (!files || files.length === 0) {
      return { success: true, message: "Sin archivos para subir" };
    }

    const { validFiles, ignoredFiles, invalidTypeFiles } = files.reduce(
      (acc, file) => {
        if (file.type && !ALLOWED_MIME.has(file.type)) {
          acc.invalidTypeFiles.push({ name: file.name, type: file.type });
          return acc;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          acc.ignoredFiles.push({ name: file.name, sizeMB: file.size / 1024 / 1024 });
        } else {
          acc.validFiles.push(file);
        }
        return acc;
      },
      {
        validFiles: [] as File[],
        ignoredFiles: [] as Array<{ name: string; sizeMB: number }>,
        invalidTypeFiles: [] as Array<{ name: string; type: string }>,
      }
    );

    if (ignoredFiles.length > 0) {
      console.warn(
        "⚠️ Archivos ignorados por tamaño:",
        ignoredFiles.map((f) => `${f.name} (${f.sizeMB.toFixed(2)} MB)`).join(", ")
      );
    }

    if (invalidTypeFiles.length > 0) {
      console.warn(
        "⚠️ Archivos ignorados por tipo:",
        invalidTypeFiles.map((f) => `${f.name} (${f.type || "tipo desconocido"})`).join(", ")
      );
    }

    if (validFiles.length === 0) {
      return {
        success: false,
        error: `Todos los archivos exceden el límite de ${MAX_FILE_SIZE_MB} MB.`,
      };
    }

    const totalBatches = Math.ceil(validFiles.length / MAX_FILES_PER_REQUEST);
    if (totalBatches > 1) {
      console.warn(
        `⚠️ Se enviarán ${validFiles.length} archivos en ${totalBatches} lotes (máx ${MAX_FILES_PER_REQUEST} por request).`
      );
    }

    const results: ApiResponse[] = [];
    for (let i = 0; i < validFiles.length; i += MAX_FILES_PER_REQUEST) {
      const batch = validFiles.slice(i, i + MAX_FILES_PER_REQUEST);

      const formDataToProxy = new FormData();
      formDataToProxy.append("action", "subir-archivos");
      formDataToProxy.append("registro_id", String(registroId));
      formDataToProxy.append("tipo", tipo || "PLANO");

      batch.forEach((file) => {
        formDataToProxy.append("files", file, file.name);
      });

      const response = await fetch(LOCAL_API, {
        method: "POST",
        body: formDataToProxy,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        results.push({
          success: false,
          error: `Error al subir archivos: ${data.error || response.statusText}`,
        });
      } else {
        results.push({ success: true, data, message: "Archivos subidos exitosamente" });
      }
    }

    const failed = results.find((r) => !r.success);
    if (failed) {
      return failed;
    }

    return { success: true, message: "Archivos subidos exitosamente" };
  } catch (error) {
    console.error("Error al subir archivos:", error);
    return {
      success: false,
      error: `Error al subir archivos: ${error instanceof Error ? error.message : String(error)}`,
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
  archivosAdicionales?: File[]
): Promise<ApiResponse<{ cod_hash?: string; registro_id?: number }>> {
  try {
    console.log("📤 Iniciando envío de caratula completa...");

    // 1. Enviar categoría
    console.log("1️⃣ Enviando categoría...");
    const catResult = await enviarCategoria(categoria);
    if (!catResult.success) {
      console.warn("⚠️ Advertencia al enviar categoría:", catResult.error);
      // Continuamos de todas formas
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

    const registroId = regResult.data?.id;
    const codHash = regResult.data?.cod_hash;

    if (!registroId) {
      return { success: false, error: "No se obtuvo ID de registro" };
    }

    // 3. Subir archivos
    const archivosParaSubir: File[] = [];
    if (pdfFile) archivosParaSubir.push(pdfFile);
    if (archivosAdicionales) archivosParaSubir.push(...archivosAdicionales);

    if (archivosParaSubir.length > 0) {
      console.log("3️⃣ Subiendo archivos...");
      const filesResult = await enviarArchivos(registroId, archivosParaSubir, "PLANO");
      if (!filesResult.success) {
        console.warn("⚠️ Advertencia al subir archivos:", filesResult.error);
        // Continuamos de todas formas - el registro está creado
      }
    }

    return {
      success: true,
      data: { cod_hash: sha256 || codHash, registro_id: registroId },
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
