// /utils/inputSanitizers.ts

// Solo números enteros (0-9)
export const onlyNumbers = (value: string): string => {
  return value.replace(/[^\d]/g, "");
};

// Números y punto (para decimales)
export const onlyNumbersAndDot = (value: string): string => {
  let cleaned = value.replace(/[^\d.]/g, "");
  // Evitar múltiples puntos
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  return cleaned;
};

// Números, punto y menos (para coordenadas que pueden ser negativas)
export const onlyNumbersDotAndMinus = (value: string): string => {
  // Permite dígitos, punto y signo menos (solo al inicio)
  let cleaned = value.replace(/[^\d.-]/g, "");
  // Solo permitir un signo menos al inicio
  if (cleaned.indexOf("-") > 0) {
    cleaned = cleaned.replace(/-/g, "");
  }
  // Si hay múltiples signos menos al inicio, dejar solo uno
  if (cleaned.startsWith("--")) {
    cleaned = "-" + cleaned.replace(/-/g, "");
  }
  // Evitar múltiples puntos
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  return cleaned;
};

// Solo letras, espacios, tildes y ñ
export const onlyLetters = (value: string): string => {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, "");
};

// Letras y números (para campos "ambos")
export const onlyLettersAndNumbers = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]/g, "");
};

// Para coordenadas (formato: -16.5, -68.15)
export const sanitizeCoordinate = (value: string): string => {
  // Permite: números, punto, coma, signo menos, espacios
  // Pero BLOQUEA cualquier letra
  let cleaned = value.replace(/[^\d.,\-\s]/g, "");
  
  // Asegurar que el signo menos solo esté al inicio de cada número
  // Si hay un menos en medio, lo eliminamos
  const parts = cleaned.split(",");
  const sanitizedParts = parts.map(part => {
    let trimmed = part.trim();
    // Si tiene más de un menos o menos en medio, limpiar
    const minusCount = (trimmed.match(/-/g) || []).length;
    if (minusCount > 1) {
      trimmed = trimmed.replace(/-/g, "");
    }
    if (trimmed.startsWith("-") && trimmed.length > 1) {
      // Mantener el menos al inicio
      return "-" + trimmed.replace(/-/g, "");
    }
    return trimmed.replace(/-/g, "");
  });
  
  return sanitizedParts.join(", ");
};