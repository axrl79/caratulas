// Tipos de datos permitidos para cada campo
export type FieldDataType = 
  | "numeral"      // Solo números, sin letras
  | "literal"      // Solo letras, espacios, tildes, ñ
  | "ambos";       // Texto libre

// Configuración simplificada
export interface FieldTypeConfig {
  type: FieldDataType;
  allowDecimals?: boolean;
}

// Mapeo de campos a sus tipos (usa los mismos nombres que en FIELDS)
export const FIELD_TYPE_MAP: Record<string, FieldTypeConfig> = {
  // ===== COORDENADAS =====
  "coordenadas": { type: "ambos" },
  
  // ===== AMBOS (letras y números) =====
  "distritoJudicial": { type: "ambos" },
  "ubicacionInstalacion": { type: "ambos" },
  "municipio": { type: "ambos" },
  "zona": { type: "ambos" },
  "calle": { type: "ambos" },
  "numNiveles": { type: "ambos" },
  "fuenteEnergia": { type: "ambos" },
  "funcionPrincipal": { type: "ambos" },
  "normaDiseno": { type: "ambos" },
  "normaVerificacion": { type: "ambos" },
  "normaTecnica": { type: "ambos" },
  "nombreJuzgado": { type: "ambos" },
  
  // ===== LITERAL (solo letras) =====
  "nombreInteresado": { type: "literal" },
  "interesado": { type: "literal" },
  "ingNombre": { type: "literal" },
  
  // ===== NUMERAL (solo números) =====
  "nurej": { type: "numeral", allowDecimals: false },
  "alturaMaximaMuro": { type: "numeral", allowDecimals: true },
  "luzTotalPuente": { type: "numeral", allowDecimals: true },
  "longitudTotalSistema": { type: "numeral", allowDecimals: true },
  "numArtefactos": { type: "numeral", allowDecimals: false },
  "volumenMovimientoTierras": { type: "numeral", allowDecimals: true },
  "volumenDemolicion": { type: "numeral", allowDecimals: true },
  "pesoTotal": { type: "numeral", allowDecimals: true },
  "dimensionesPrincipales": { type: "numeral", allowDecimals: true },
  "potenciaInstalada": { type: "numeral", allowDecimals: true },
  "potenciaDemandada": { type: "numeral", allowDecimals: true },
  "tensionAlimentacion": { type: "numeral", allowDecimals: true },
  "superficieAConstruir": { type: "numeral", allowDecimals: true },
  "superficieTableroAConstruir": { type: "numeral", allowDecimals: true },
  "superficieAReforzar": { type: "numeral", allowDecimals: true },
  "superficieConstruida": { type: "numeral", allowDecimals: true },
  "superficieTablero": { type: "numeral", allowDecimals: true },
  "superficieTerreno": { type: "numeral", allowDecimals: true },
  "superficieProspeccion": { type: "numeral", allowDecimals: true },
  "areaMuroContencionAConstruir": { type: "numeral", allowDecimals: true },
  "areaEstribosAConstruir": { type: "numeral", allowDecimals: true },
  "areaMuroContencionAReforzar": { type: "numeral", allowDecimals: true },
  "areaMuroContencion": { type: "numeral", allowDecimals: true },
  "areaEstribos": { type: "numeral", allowDecimals: true },
  "areaMuroContencionHormigonArmado": { type: "numeral", allowDecimals: true },
  "areaMuroContencionHormigonCiclipeo": { type: "numeral", allowDecimals: true },
  "rni": { type: "numeral", allowDecimals: false },
  "numPlanos": { type: "numeral", allowDecimals: false },
  "numCopias": { type: "numeral", allowDecimals: false },
};

// Función para obtener el tipo de un campo
export function getFieldType(key: string): FieldDataType | null {
  return FIELD_TYPE_MAP[key]?.type || null;
}

// Función para saber si permite decimales
export function allowsDecimals(key: string): boolean {
  return FIELD_TYPE_MAP[key]?.allowDecimals ?? false;
}

// Validación SIMPLE y EFECTIVA
export function validateByType(key: string, value: string): { valid: boolean; message: string; cleanValue: string } {
  // Si está vacío, es válido (opcional)
  if (!value || value.trim() === "") {
    return { valid: true, message: "", cleanValue: "" };
  }
  
  const type = getFieldType(key);
  const trimmed = value.trim();
  
  switch (type) {
    case "numeral": {
      // Limpiar: solo números, punto y coma (convertir coma a punto)
      let cleaned = trimmed.replace(",", ".");
      // Eliminar todo lo que no sea número o punto
      cleaned = cleaned.replace(/[^\d.]/g, "");
      // Evitar múltiples puntos
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
      }
      
      // Validar que sea un número
      const num = parseFloat(cleaned);
      if (isNaN(num)) {
        return { valid: false, message: "Solo se permiten números", cleanValue: trimmed };
      }
      
      // Validar que no sea negativo
      if (num < 0) {
        return { valid: false, message: "No se permiten números negativos", cleanValue: trimmed };
      }
      
      // Si no permite decimales, redondear
      if (!allowsDecimals(key) && cleaned.includes(".")) {
        const rounded = Math.floor(num).toString();
        return { valid: true, message: "", cleanValue: rounded };
      }
      
      return { valid: true, message: "", cleanValue: cleaned };
    }
    
    case "literal": {
      // Solo letras, espacios, tildes, ñ, guiones y apóstrofes
      const literalRegex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-']+$/;
      if (!literalRegex.test(trimmed)) {
        return { valid: false, message: "Solo se permiten letras (sin números)", cleanValue: trimmed };
      }
      return { valid: true, message: "", cleanValue: trimmed };
    }
    
    case "ambos":
    default: {
      // Para "ambos", permitimos casi todo excepto caracteres raros
      const ambosRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\.,\-_/#()°]+$/;
      if (!ambosRegex.test(trimmed)) {
        return { valid: false, message: "Caracteres no permitidos", cleanValue: trimmed };
      }
      return { valid: true, message: "", cleanValue: trimmed };
    }
  }
}