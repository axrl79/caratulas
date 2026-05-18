import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../utils/rateLimiter";
import { mockDb } from "../../utils/mockDb";

export const dynamic = "force-dynamic";

// Permitted extensions set
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

// Invalid special characters regex for filenames
const INVALID_CHARS_REGEX = /[<>:"\/\\|?*\x00-\x1F\x7F]/;

/**
 * POST /api/visados/archivos
 * Sube archivos para un registro de visado
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting check
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 20 requests per minute
    const rateLimit = checkRateLimit(clientIp, 20, 60000);

    const headers = new Headers();
    headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    headers.set("X-RateLimit-Reset", String(rateLimit.resetSeconds));

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Demasiadas subidas",
          details: `Has excedido el límite de subidas. Reintentar en ${rateLimit.resetSeconds} segundos.`,
          remaining: rateLimit.remaining,
          resetIn: rateLimit.resetSeconds,
          status: 429,
        },
        { status: 429, headers }
      );
    }

    // Parse request content-type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de contenido inválido. Debe ser multipart/form-data.",
          code: "INVALID_CONTENT_TYPE",
        },
        { status: 400, headers }
      );
    }

    const formData = await request.formData();

    // 2. Validate registro_id (mandatory & numeric)
    const registroIdStr = formData.get("registro_id");
    if (!registroIdStr) {
      return NextResponse.json(
        {
          success: false,
          error: "El campo 'registro_id' es obligatorio.",
          code: "MISSING_REGISTRO_ID",
        },
        { status: 400, headers }
      );
    }

    const registroId = Number(registroIdStr);
    if (isNaN(registroId) || registroId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "El campo 'registro_id' debe ser un número entero válido.",
          code: "INVALID_REGISTRO_ID",
        },
        { status: 400, headers }
      );
    }

    // Verify registration exists in database
    if (!mockDb.registroExists(registroId)) {
      return NextResponse.json(
        {
          success: false,
          error: `No existe ningún registro de visado con el ID ${registroId}.`,
          code: "REGISTRO_NOT_FOUND",
        },
        { status: 404, headers }
      );
    }

    // 3. Validate files presence (cannot be empty)
    const files = formData.getAll("files") as File[];
    
    // Filter out dummy/empty files that might be submitted
    const validFiles = files.filter(f => f && f.name && f.size > 0);

    if (validFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Debe incluir al menos un archivo para subir.",
          code: "EMPTY_FILES",
        },
        { status: 400, headers }
      );
    }

    // 4. Validate max 3 files per load (Vercel batch limit)
    if (validFiles.length > 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Validación de archivos falló",
          invalidFiles: validFiles.map(f => ({
            nombre: f.name,
            errores: ["Excede el límite por request"],
            sugerencias: ["💡 Vercel tiene un límite de 3 archivos por request", "💡 Usa useVercelSafeUpload para dividir en lotes automáticamente"]
          })),
          suggestions: [
            "💡 Vercel tiene un límite de 3 archivos por request",
            "💡 Estás intentando subir demasiados archivos a la vez"
          ],
          status: 400
        },
        { status: 400, headers }
      );
    }

    // 5. Validate total size maximum 300MB
    const totalSize = validFiles.reduce((sum, f) => sum + f.size, 0);
    const MAX_TOTAL_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB Vercel Serverless limit
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload Too Large",
          details: `El tamaño total de los archivos (${(totalSize / 1024 / 1024).toFixed(1)}MB) excede el límite permitido por Vercel (4.5MB)`,
          suggestions: [
            "💡 Vercel tiene un límite de 4.5MB por request",
            "💡 Estás intentando subir archivos muy grandes a la vez",
            "💡 Solución: Usa useVercelSafeUpload para dividir en lotes automáticamente"
          ],
          status: 413
        },
        { status: 413, headers }
      );
    }

    // 6. Validate individual size maximum 50MB
    const MAX_SINGLE_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB limit
    const oversizedFiles = validFiles.filter((f) => f.size > MAX_SINGLE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validación de archivos falló",
          invalidFiles: oversizedFiles.map(f => ({
            nombre: f.name,
            errores: [`El archivo excede el tamaño máximo de 4.5MB (tamaño actual: ${(f.size / 1024 / 1024).toFixed(1)}MB)`],
            sugerencias: [
              "💡 Reduce el tamaño comprimiéndolo",
              "💡 Usa una herramienta online como ilovepdf.com"
            ]
          })),
          suggestions: [
            "💡 Vercel tiene un límite estricto de 4.5MB por petición."
          ],
          status: 400
        },
        { status: 400, headers }
      );
    }

    // 7. Validate permitted formats (pdf, png, jpg, jpeg, webp, docx, xlsx, zip, rar)
    const invalidFormatFiles = validFiles.filter((f) => {
      const parts = f.name.split(".");
      const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
      return !ext || !ALLOWED_EXTENSIONS.has(ext);
    });

    if (invalidFormatFiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validación de archivos falló",
          invalidFiles: invalidFormatFiles.map(f => {
            const ext = f.name.split(".").pop() || "sin extensión";
            return {
              nombre: f.name,
              errores: [`Formato .${ext} no permitido`],
              sugerencias: ["💡 Convierte el archivo a PDF, PNG, JPG, o empaquétalo en ZIP"]
            };
          }),
          status: 400
        },
        { status: 400, headers }
      );
    }

    // 8. Validate duplicate filenames in the same upload
    const fileNames = validFiles.map((f) => f.name);
    const duplicatesInBatch = fileNames.filter(
      (name, idx) => fileNames.indexOf(name) !== idx
    );

    if (duplicatesInBatch.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Se detectaron nombres de archivos duplicados en la misma carga.",
          code: "DUPLICATE_FILES_IN_BATCH",
          details: Array.from(new Set(duplicatesInBatch)),
        },
        { status: 400, headers }
      );
    }

    // 9. Validate unique names do not clash with already existing files of the registration
    const registro = mockDb.getRegistro(registroId);
    if (registro && registro.files) {
      const existingFileNames = new Set(registro.files.map((f) => f.name));
      const clashes = validFiles.filter((f) => existingFileNames.has(f.name));

      if (clashes.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Conflicto de nombres: Uno o varios archivos ya fueron subidos a este registro anteriormente.",
            code: "FILE_NAME_CLASH",
            details: clashes.map((f) => f.name),
          },
          { status: 400, headers }
        );
      }
    }

    // 10. Validate invalid special characters in filenames (e.g. < > : " / \ | ? *)
    const invalidCharFiles = validFiles.filter((f) => INVALID_CHARS_REGEX.test(f.name));
    if (invalidCharFiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validación de archivos falló",
          invalidFiles: invalidCharFiles.map(f => ({
            nombre: f.name,
            errores: ["Nombre de archivo contiene caracteres inválidos: <, >, :, \", /, \\, |, ?, *"],
            sugerencias: ["💡 Renombra eliminando caracteres especiales"]
          })),
          status: 400
        },
        { status: 400, headers }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Validations successful! Add files and update mock database
    // ─────────────────────────────────────────────────────────────────────────
    const tipoStr = formData.get("tipo")?.toString() || "OTRO";

    mockDb.addFilesToRegistro(
      registroId,
      validFiles.map((f) => ({
        name: f.name,
        type: f.type || "application/octet-stream",
        size: f.size,
      }))
    );

    console.log(`[Files API] ${validFiles.length} archivos agregados a Registro #${registroId}`);

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const archivos_subidos = validFiles.map((f, idx) => ({
      id: crypto.randomUUID(),
      nombre_archivo: f.name,
      tipo: tipoStr,
      url: `https://r2.example.com/visados/local-mock/${f.name}`,
      tamanio: f.size,
      tipo_archivo: f.type || "application/octet-stream",
      sha256: "mock_hash_for_testing_purposes_only",
      comprimido: false,
      createdAt: new Date().toISOString()
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          archivos_subidos,
          registro_id: registroId,
          cod_hash: registro?.cod_hash || "mock-hash-12345"
        },
        summary: {
          total_procesados: validFiles.length,
          exitosos: validFiles.length,
          fallidos: 0,
          tamanio_total: totalSize,
          tamanio_total_formateado: formatBytes(totalSize)
        }
      },
      { status: 201, headers }
    );
  } catch (error) {
    console.error("[Files API] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
