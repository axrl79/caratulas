// /utils/normalizeDecimal.ts

/**
 * Convierte una cadena con coma o punto a número con punto decimal
 * Ej: "123,45" → "123.45", "123.45" → "123.45"
 */
export function normalizeDecimalToPoint(value: string): string {
  if (!value || value.trim() === "") return "";
  
  // Reemplazar la primera coma por punto
  let normalized = value.replace(",", ".");
  
  // Validar que sea un número válido
  const num = parseFloat(normalized);
  if (isNaN(num)) return value;
  
  return num.toString();
}

/**
 * Limpia y valida un string decimal para mostrar en previsualización/PDF
 */
export function sanitizeDecimal(value: string): string {
  if (!value) return "";
  
  // Permitir solo dígitos, coma, punto y signo negativo
  let cleaned = value.replace(/[^\d,.-]/g, "");
  
  // Manejar comas: primera coma a punto, eliminar resto
  const hasComma = cleaned.includes(",");
  if (hasComma) {
    cleaned = cleaned.replace(",", ".");
    cleaned = cleaned.replace(/,/g, "");
  }
  
  // Evitar múltiples puntos
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? value : num.toString();
}