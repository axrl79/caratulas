/**
 * ─────────────────────────────────────────────────────────────────────────
 * MOCK API - Para pruebas sin autenticación
 * Reemplaza a convenios-lake mientras se configura la autenticación real
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "../../utils/mockDb";

/**
 * POST /api/mock/caratulas
 * API Mock para desarrollo/pruebas
 */
export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json();

    if (!action || !payload) {
      return NextResponse.json(
        { success: false, error: "action y payload son requeridos" },
        { status: 400 }
      );
    }

    console.log(`[Mock API] ${action}:`, payload);

    switch (action) {
      case "crear-categoria": {
        // Simular creación de categoría
        return NextResponse.json(
          {
            success: true,
            data: {
              code: payload.code,
              nombre: payload.nombre,
              descripcion: payload.descripcion,
            },
          },
          { status: 201 }
        );
      }

      case "crear-registro": {
        // Simular creación de registro utilizando la base de datos compartida
        const newRegistro = mockDb.crearRegistro(payload);
        
        // DEBUG
        console.log("[Mock API] DEBUG crear-registro:", {
          payload_cod_hash: payload.cod_hash,
          payload_sha256: payload.sha256,
          codHash_generado: newRegistro.cod_hash,
          usandoSHA256: !!payload.sha256,
          usandoCOD_HASH: !!payload.cod_hash,
        });

        console.log(`[Mock API] Registro creado: ID=${newRegistro.id}, Hash=${newRegistro.cod_hash}`);

        return NextResponse.json(
          {
            success: true,
            data: {
              id: newRegistro.id,
              cod_hash: newRegistro.cod_hash,
            },
          },
          { status: 201 }
        );
      }

      case "subir-archivos": {
        // Simular subida de archivos utilizando la base de datos compartida
        const registroId = Number(payload.registro_id);
        if (isNaN(registroId) || !mockDb.registroExists(registroId)) {
          return NextResponse.json(
            { success: false, error: "Registro no encontrado" },
            { status: 404 }
          );
        }

        const filesArray = payload.files?.map((f: any) => ({
          name: f.name,
          type: f.type || "application/octet-stream",
          size: f.size || 0,
        })) || [];

        mockDb.addFilesToRegistro(registroId, filesArray);

        console.log(`[Mock API] Archivos subidos a registro ${registroId}`);

        return NextResponse.json(
          {
            success: true,
            data: {
              registro_id: registroId,
              files_count: filesArray.length,
            },
          },
          { status: 201 }
        );
      }

      default:
        return NextResponse.json(
          { success: false, error: `Acción desconocida: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Mock API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mock/caratulas
 * Obtener registros guardados (para debugging)
 */
export async function GET() {
  const dbContents = mockDb.getRegistros();
  return NextResponse.json(
    {
      registros: dbContents,
      count: Object.keys(dbContents).length,
    },
    { status: 200 }
  );
}
