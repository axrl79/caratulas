// ─────────────────────────────────────────────────────────────────────────
// diccionarios.ts - Punto central de importaciones
// Este archivo re-exporta todos los módulos para facilitar las importaciones
// ─────────────────────────────────────────────────────────────────────────

// TIPOS
export type { FieldKey, Disciplina, Field, Categoria, FormData, FieldRule } from "./types";

// CATEGORÍAS
export { ESTRUCTURA_CATEGORIAS, CATEGORIAS } from "./categories";

// CAMPOS
export { FIELDS, personFields, controlFields, peritajeFields, QR_ORDER } from "./fields";

// REGLAS DE VALIDACIÓN
export { CATEGORY_FIELD_RULES } from "./fieldRules";

// LOGOS
export { CATEGORY_LOGOS, CARATULA_ASSETS } from "./logos";

// TEMAS
export { THEMES, FONT_STYLES, FONT_SIZES } from "./themes";