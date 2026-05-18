/**
 * ─────────────────────────────────────────────────────────────────────────
 * API Route - Server-side proxy para convenios-lake
 * Evita problemas de CORS haciendo las llamadas desde el servidor
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";

const REMOTE_API = process.env.NEXT_PUBLIC_API_URL || "https://convenios-lake.vercel.app";

/**
 * POST /api/caratulas
 * Proxy que redirecciona peticiones al servidor remoto
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let action: string | null = null;
    let payload: any;

    if (isMultipart) {
      const formData = await request.formData();
      const actionField = formData.get("action");
      action = typeof actionField === "string" ? actionField : null;
      payload = formData;
    } else {
      const bodyJson = await request.json();
      action = bodyJson?.action ?? null;
      payload = bodyJson?.payload;
    }

    if (!action || !payload) {
      return NextResponse.json(
        { success: false, error: "action y payload son requeridos" },
        { status: 400 }
      );
    }

    let endpoint = "";
    let method = "POST";
    let body: any;
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    switch (action) {
      case "crear-categoria":
        endpoint = "/api/visados/categorias";
        body = JSON.stringify(payload);
        break;

      case "crear-registro":
        endpoint = "/api/visados/registros";
        body = JSON.stringify(payload);
        break;

      case "archivos-exitosos":
        endpoint = `/api/visados/archivos-exitosos?cod_hash=${payload.cod_hash}`;
        method = "GET";
        body = undefined;
        break;

      case "subir-archivos":
        endpoint = "/api/visados/archivos";

        if (payload instanceof FormData) {
          body = payload;
        } else {
          const formData = new FormData();
          formData.append("registro_id", String(payload.registro_id));
          formData.append("tipo", payload.tipo || "PLANO");

          if (payload.files && Array.isArray(payload.files)) {
            for (const file of payload.files) {
              const binaryString = atob(file.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: file.type });
              formData.append("files", blob, file.name);
            }
          }

          body = formData;
        }

        // Eliminar Content-Type para que fetch establezca boundary automáticamente
        delete headers["Content-Type"];
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Acción desconocida: ${action}` },
          { status: 400 }
        );
    }

    console.log(`[Proxy] ${action} → ${endpoint}`);

    if (action === "crear-registro") {
      console.log("[Proxy] crear-registro salida al remoto/local:", {
        endpoint,
        headers,
        payload: body instanceof FormData ? "[FormData]" : JSON.parse(String(body)),
      });
    }

    // Determinar la URL base (remota o local mock)
    // Por defecto es MOCK si no está en false para facilitar desarrollo sin tokens remotos
    const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
    const requestUrl = new URL(request.url);
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http:" : "https:";
    const localBaseUrl = `${protocol}//${host}`;

    let targetUrl = "";
    if (isMockMode) {
      if (action === "subir-archivos") {
        // En modo mock, enviamos archivos a nuestro endpoint local oficial /api/visados/archivos
        targetUrl = `${localBaseUrl}/api/visados/archivos`;
      } else if (action === "archivos-exitosos") {
        targetUrl = `${localBaseUrl}${endpoint}`;
      } else {
        // En modo mock, categorías y registros van al mock general
        targetUrl = `${localBaseUrl}/api/mock/caratulas`;
      }
      
      // En modo local mock, el proxy tiene que enviar JSON para categorías/registros
      if (action !== "subir-archivos" && typeof body === "string") {
        body = JSON.stringify({
          action,
          payload: JSON.parse(body)
        });
      }
    } else {
      targetUrl = `${REMOTE_API}${endpoint}`;
    }

    console.log(`[Proxy] Redireccionando a: ${targetUrl}`);

    // Hacer request al servidor correspondiente
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn(`[Proxy] Respuesta ${response.status}:`, responseData);
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
