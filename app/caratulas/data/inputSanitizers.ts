// ─────────────────────────────────────────────────────────────────────────
// INPUT SANITIZERS
// Funciones que limpian y restringen el valor de cada campo al escribir
// ─────────────────────────────────────────────────────────────────────────

// ── ENTEROS ──────────────────────────────────────────────────────────────

/** Solo dígitos 0-9, sin decimales ni otros caracteres */
export const onlyNumbers = (value: string): string => {
  return value.replace(/[^\d]/g, "");
};

// ── DECIMALES ────────────────────────────────────────────────────────────

/** Números y punto decimal (sin límite de decimales) */
export const onlyNumbersAndDot = (value: string): string => {
  let cleaned = value.replace(/[^\d.]/g, "").replace(",", ".");
  const parts = cleaned.split(".");
  if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
  return cleaned;
};

/**
 * Números con máximo N decimales.
 * Acepta coma o punto como separador decimal (convierte coma a punto).
 * Usado para: superficies, áreas, volúmenes, potencias, etc.
 */
export const onlyNumbersMaxDecimals = (value: string, maxDecimals: number): string => {
  // Convertir coma a punto y eliminar todo lo que no sea dígito o punto
  let cleaned = value.replace(",", ".").replace(/[^\d.]/g, "");
  // Evitar múltiples puntos
  const parts = cleaned.split(".");
  if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
  // Limitar decimales
  const finalParts = cleaned.split(".");
  if (finalParts.length === 2 && finalParts[1].length > maxDecimals) {
    cleaned = finalParts[0] + "." + finalParts[1].slice(0, maxDecimals);
  }
  return cleaned;
};

// ── LETRAS ───────────────────────────────────────────────────────────────

/** Solo letras, espacios, tildes y ñ. Sin números ni símbolos. */
export const onlyLetters = (value: string): string => {
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-'\.]/g, "");
};

// ── AMBOS ────────────────────────────────────────────────────────────────

/** Letras y números (sin restricción de caracteres especiales básicos) */
export const onlyLettersAndNumbers = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]/g, "");
};

// ── CAMPOS ESPECIALES ────────────────────────────────────────────────────

/**
 * Coordenadas — formato: -16.503487; -68.130420
 * Permite: dígitos, punto, coma, signo menos, punto y coma, espacios.
 * Bloquea letras y cualquier otro carácter.
 */
export const sanitizeCoordinate = (value: string): string => {
  // Permitir solo: dígitos, punto, coma, menos, punto y coma, espacio
  let cleaned = value.replace(/[^\d.,;\-\s]/g, "");

  // Separar por ; o , para manejar cada coordenada
  const separator = cleaned.includes(";") ? ";" : ",";
  const parts = cleaned.split(separator);

  const sanitizedParts = parts.map(part => {
    let trimmed = part.trim();
    // Solo un signo menos, al inicio
    const hasMinus = trimmed.startsWith("-");
    trimmed = trimmed.replace(/-/g, "");
    if (hasMinus) trimmed = "-" + trimmed;
    // Solo un punto decimal
    const dotParts = trimmed.split(".");
    if (dotParts.length > 2) trimmed = dotParts[0] + "." + dotParts.slice(1).join("");
    return trimmed;
  });

  return sanitizedParts.join("; ");
};

/**
 * NUREJ — solo números, máximo 13 dígitos.
 */
export const sanitizeNurej = (value: string): string => {
  return value.replace(/[^\d]/g, "").slice(0, 13);
};

/**
 * Dimensiones L×A×H — permite números, punto, coma y separadores × o x o *.
 * Convierte * y x a × automáticamente.
 * Ejemplo resultado: 2.5 × 1.8 × 3.2
 */
export const sanitizeDimensiones = (value: string): string => {
  // Permitir solo dígitos, punto, coma, espacio, x, ×, *
  let cleaned = value.replace(/[^\d.,x×*\s]/gi, "");
  // Normalizar separadores: * y x → ×
  cleaned = cleaned.replace(/\*/g, " × ").replace(/x/gi, " × ");
  // Evitar múltiples espacios
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  return cleaned;
};

/**
 * Números con punto y signo menos (para coordenadas individuales).
 * Permite negativos, un solo punto decimal.
 */
export const onlyNumbersDotAndMinus = (value: string): string => {
  let cleaned = value.replace(/[^\d.-]/g, "");
  if (cleaned.indexOf("-") > 0) cleaned = cleaned.replace(/-/g, "");
  if (cleaned.startsWith("--")) cleaned = "-" + cleaned.replace(/-/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
  return cleaned;
};