import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "../../utils/mockDb";

export const dynamic = "force-dynamic";

/**
 * GET /api/visados/archivos-exitosos
 * Recupera los archivos subidos exitosamente para un registro específico
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codHash = searchParams.get("cod_hash");
    const registroIdStr = searchParams.get("registro_id");

    if (!codHash && !registroIdStr) {
      return NextResponse.json(
        {
          success: false,
          error: "Parámetros faltantes",
          details: "Debe proporcionar cod_hash o registro_id."
        },
        { status: 400 }
      );
    }

    let registro = null;

    if (registroIdStr) {
      registro = mockDb.getRegistro(Number(registroIdStr));
    } else if (codHash) {
      // Find by cod_hash in mockDb
      const allRegistros = Object.values(mockDb.getRegistros());
      registro = allRegistros.find((r: any) => r.cod_hash === codHash) || null;
    }

    if (!registro) {
      return NextResponse.json(
        {
          success: false,
          error: "Registro no encontrado",
          details: `No existe registro con el identificador proporcionado.`
        },
        { status: 404 }
      );
    }

    const files = registro.files || [];
    
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const archivos_exitosos = files.map((f: any) => ({
      id: crypto.randomUUID(),
      nombre_archivo: f.name,
      tipo: "OTRO", // mock default
      tamanio: f.size,
      tipo_archivo: f.type || "application/octet-stream",
      createdAt: new Date().toISOString(),
      url: `https://r2.example.com/visados/${registro.cod_hash || "mock"}/${f.name}`
    }));

    const totalSize = files.reduce((sum: number, f: any) => sum + f.size, 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          registro_id: registro.id,
          cod_hash: registro.cod_hash,
          archivos_exitosos,
          estadisticas: {
            total: archivos_exitosos.length,
            tamanio_total: totalSize,
            tamanio_total_formateado: formatBytes(totalSize),
            por_tipo: {
              OTRO: archivos_exitosos.length
            }
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Archivos Exitosos API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
