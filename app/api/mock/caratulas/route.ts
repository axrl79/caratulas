/**
 * ─────────────────────────────────────────────────────────────────────────
 * MOCK API - Para pruebas sin autenticación
 * Reemplaza a convenios-lake mientras se configura la autenticación real
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";

// Almacenamiento temporal en memoria (solo para desarrollo)
let registrosDB: Record<number, any> = {};
let registroCounter = 1;

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
        // Simular creación de registro
        const id = registroCounter++;
        // Usar SHA256 o cod_hash del payload como cod_hash
        const codHash = payload.cod_hash || payload.sha256 || `VIS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        // DEBUG
        console.log("[Mock API] DEBUG crear-registro:", {
          payload_cod_hash: payload.cod_hash,
          payload_sha256: payload.sha256,
          codHash_generado: codHash,
          usandoSHA256: !!payload.sha256,
          usandoCOD_HASH: !!payload.cod_hash,
        });
        
        registrosDB[id] = {
          id,
          cod_hash: codHash,
          ...payload,
          createdAt: new Date().toISOString(),
        };

        console.log(`[Mock API] Registro creado: ID=${id}, Hash=${codHash}`);

        return NextResponse.json(
          {
            success: true,
            data: {
              id,
              cod_hash: codHash,
            },
          },
          { status: 201 }
        );
      }

      case "subir-archivos": {
        // Simular subida de archivos
        const registroId = payload.registro_id;
        if (!registrosDB[registroId]) {
          return NextResponse.json(
            { success: false, error: "Registro no encontrado" },
            { status: 404 }
          );
        }

        registrosDB[registroId].files = payload.files?.map((f: any) => ({
          name: f.name,
          type: f.type,
          size: f.size,
        })) || [];

        console.log(`[Mock API] Archivos subidos a registro ${registroId}`);

        return NextResponse.json(
          {
            success: true,
            data: {
              registro_id: registroId,
              files_count: payload.files?.length || 0,
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
  return NextResponse.json(
    {
      registros: registrosDB,
      count: Object.keys(registrosDB).length,
    },
    { status: 200 }
  );
}
