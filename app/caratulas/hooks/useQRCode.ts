import { useState, useEffect } from "react";
import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  scale?: number;
  version?: number;
  maskPattern?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  margin?: number;
  type?: "image/png" | "image/jpeg" | "image/webp";
  dark?: string;
  light?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

// ── Presets optimizados para PDF ──────────────────────────────────────────
export const QR_PRESETS = {
  /** Tamaño estándar (5cm) para pantalla */
  default: {
    width: 300,
    scale: 4,
    margin: 1,
    errorCorrectionLevel: "M" as const,
  },
  /** Optimizado para PDF 2.5cm - DATOS GRANDES visibles */
  printSmall: {
    width: 800,           // MÁXIMA resolución
    scale: 10,            // MÁXIMA escala interna
    margin: 1,            // Mínimo margen para aprovechar espacio
    errorCorrectionLevel: "M" as const,  // Balance: datos más grandes que con H
    dark: "#000000",
    light: "#FFFFFF",
  },
  /** Para PDF tamaño medio (3-4cm) */
  printMedium: {
    width: 500,
    scale: 6,
    margin: 2,
    errorCorrectionLevel: "Q" as const,
    dark: "#000000",
    light: "#FFFFFF",
  },
} as const;

export function useQRCode(value: string, options?: QRCodeOptions) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrVersion, setQrVersion] = useState<number>(0);
  const [moduleCount, setModuleCount] = useState<number>(0);

  useEffect(() => {
    let isActive = true;

    if (!value) {
      console.log("⚠️ useQRCode: value vacío");
      setQrDataUrl("");
      setError(null);
      return;
    }

    const generate = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        console.log("🔄 Generando QR con datos:", value.substring(0, 100) + "...");
        
        // ── Usar datos directamente sin sobre-optimizar ──
        const dataToEncode = value || "";

        // ── Dejar que QRCode escoja la versión automáticamente ──
        // No especificar version para que se auto-ajuste
        
        const url = await QRCode.toDataURL(dataToEncode, {
          type: options?.type ?? "image/png",
          width: options?.width ?? 800,
          scale: options?.scale ?? 10,
          // Versión NO especificada - QRCode elige automáticamente
          maskPattern: options?.maskPattern ?? 4,
          margin: options?.margin ?? 1,
          color: {
            dark: options?.dark ?? "#000000",
            light: options?.light ?? "#ffffff",
          },
          errorCorrectionLevel: options?.errorCorrectionLevel ?? "L", // Cambiar a L para más espacio
        });

        if (isActive) {
          // ── Devolver QR sin mejora de contraste (la canvas da problemas) ──
          setQrDataUrl(url);
          
          // Info de debug
          console.log(`✅ QR generado exitosamente - Datos: ${dataToEncode.length} bytes`);
        }
      } catch (err) {
        if (isActive) {
          const errorMsg = err instanceof Error ? err.message : "Error desconocido";
          console.error("❌ Error generando QR:", errorMsg);
          setError(errorMsg);
          setQrDataUrl("");
        }
      } finally {
        if (isActive) setIsGenerating(false);
      }
    };

    generate();

    return () => {
      isActive = false;
    };
  }, [
    value,
    options?.width,
    options?.margin,
    options?.dark,
    options?.light,
    options?.errorCorrectionLevel,
    options?.scale,
    options?.version,
    options?.maskPattern,
  ]);

  return { qrDataUrl, isGenerating, error, qrVersion, moduleCount } as const;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Comprime datos al ABSOLUTO MÍNIMO - solo lo esencial
 * Menos datos = versión más baja = módulos MÁS GRANDES
 */
function optimizeQRDataMinimal(value: string): string {
  try {
    const obj = JSON.parse(value);
    
    // Solo incluir campos CRÍTICOS y con nombres de 1 letra
    const minimal: Record<string, unknown> = {};
    
    if (obj.code) minimal["c"] = obj.code;
    if (obj.titulo || obj.title) minimal["t"] = (obj.titulo || obj.title || "").substring(0, 20);
    if (obj.interesado) minimal["i"] = obj.interesado.substring(0, 15);
    if (obj.rni) minimal["r"] = obj.rni;
    if (obj.fecha || obj.date) minimal["f"] = obj.fecha || obj.date;
    if (obj.id) minimal["id"] = obj.id.substring(0, 8);

    // Si sigue siendo muy grande, usar solo código
    const result = JSON.stringify(minimal);
    if (result.length > 60) {
      // Ultra-minimal: solo código + timestamp
      return JSON.stringify({
        c: obj.code,
        t: Date.now().toString(36)
      });
    }
    
    return result;
  } catch {
    // Si no es JSON, truncar agresivamente
    return value.substring(0, 40);
  }
}

/**
 * Calcula la versión MÁS BAJA posible para los datos
 * Menor versión = módulos MÁS GRANDES en el espacio de 2.5cm
 */
function calculateOptimalVersion(data: string): number {
  const len = data.length;
  
  // Capacidad por versión (aprox para byte mode, nivel M)
  // Versión 1: 14 bytes, V2: 26, V3: 42, V4: 62, V5: 84
  if (len <= 14) return 1;   // 21x21 módulos - LOS MÁS GRANDES
  if (len <= 26) return 2;   // 25x25
  if (len <= 42) return 3;   // 29x29
  if (len <= 62) return 4;   // 33x33
  if (len <= 84) return 5;   // 37x37
  
  // Si los datos son muy grandes, forzar versión 6 máximo
  return 6; // 41x41 - aún aceptable para 2.5cm
}

/**
 * Binarización AGRESIVA: umbral más estricto
 * Módulos negros MÁS NEGROS para mejor escaneo en pequeño
 */
async function enhanceQRContrastHard(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Threshold más agresivo: 100 en lugar de 128
      // Esto hace los módulos oscuros MÁS OSCUROS
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Threshold BAJO = más negro = más contraste
        const value = brightness > 100 ? 255 : 0;
        
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255; // Alpha siempre opaco
      }

      ctx.putImageData(imageData, 0, 0);
      
      // También aplicar SHARPEN para bordes más definidos
      ctx.filter = "contrast(150%) brightness(1.2)";
      ctx.drawImage(canvas, 0, 0);
      
      resolve(canvas.toDataURL("image/png", 1.0));
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}