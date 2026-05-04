// ─────────────────────────────────────────────────────────────────────────
// TIPOS DE DATOS POR CAMPO
// ─────────────────────────────────────────────────────────────────────────
//
// TIPOS DISPONIBLES:
//   "ambos"      → texto libre (letras, números, símbolos)
//   "literal"    → solo letras, espacios y tildes
//   "numeral"    → solo números enteros (sin decimales)
//   "decimal2"   → números con máximo 2 decimales
//   "decimal3"   → números con máximo 3 decimales
//   "coordenadas"→ formato lat; lng (manejo especial)
//   "dimensiones"→ formato L×A×H (solo números, punto, x, ×)
//
// ─────────────────────────────────────────────────────────────────────────

import { FieldKey } from "./types";

export type FieldDataType =
  | "ambos"
  | "literal"
  | "numeral"
  | "decimal2"
  | "decimal3"
  | "coordenadas"
  | "dimensiones";

export interface FieldTypeConfig {
  type: FieldDataType;
}

export const FIELD_TYPE_MAP: Partial<Record<FieldKey, FieldTypeConfig>> = {

  // ── TEXTO LIBRE (todo valor permitido) ───────────────────────────────
  "titulo":           { type: "ambos" },
  "distritoJudicial": { type: "ambos" },
  "municipio":        { type: "ambos" },
  "zona":             { type: "ambos" },
  "calle":            { type: "ambos" },
  "niveles":          { type: "ambos" },
  "fuenteEnergia":    { type: "ambos" },
  "funcionPrincipal": { type: "ambos" },
  "norma":            { type: "ambos" },
  "normaVerif":       { type: "ambos" },
  "normaAplicacion":  { type: "ambos" },
  "nombreJuzgado":    { type: "ambos" },
  "tensionAlim":      { type: "ambos" },
  "interesado":       { type: "ambos" },
  "ubicacionInst":    { type: "ambos" },

  // ── COORDENADAS (manejo especial lat; lng) ───────────────────────────
  "coordenadas": { type: "coordenadas" },

  // ── SOLO LETRAS ──────────────────────────────────────────────────────
  // ingNombre: acepta letras y espacios, se autocompletará con "Ing. "
  "ingNombre": { type: "literal" },

  // ── SOLO NÚMEROS ENTEROS (sin decimales) ─────────────────────────────
  "nurej":       { type: "numeral" }, // máximo 13 dígitos (se controla en sanitizer)
  "rni":         { type: "numeral" },
  "numPlanos":   { type: "numeral" },
  "numCopias":   { type: "numeral" },
  "numArtefactos":{ type: "numeral" },

  // ── NÚMEROS CON MÁXIMO 2 DECIMALES ───────────────────────────────────
  "altMuro":         { type: "decimal2" },
  "luzPuente":       { type: "decimal2" },
  "volMovTierras":   { type: "decimal2" },
  "volDemolicion":   { type: "decimal2" },
  "pesoTotal":       { type: "decimal2" },
  "potenciaInst":    { type: "decimal2" },
  "potenciaDem":     { type: "decimal2" },
  "superfConstruir": { type: "decimal2" },
  "superfTableroCon":{ type: "decimal2" },
  "superfReforzar":  { type: "decimal2" },
  "superfConstruida":{ type: "decimal2" },
  "superfTablero":   { type: "decimal2" },
  "superfTerreno":   { type: "decimal2" },
  "areaMuroCon":     { type: "decimal2" },
  "areaMuroEst":     { type: "decimal2" },
  "areaMuroRef":     { type: "decimal2" },
  "areaMuro":        { type: "decimal2" },
  "areaEstribos":    { type: "decimal2" },
  "areaMuroHA":      { type: "decimal2" },
  "areaMuroHC":      { type: "decimal2" },

  // ── NÚMEROS CON MÁXIMO 3 DECIMALES ───────────────────────────────────
  "superfProspeccion": { type: "decimal3" },
  "longSistema":       { type: "decimal3" },

  // ── DIMENSIONES ESPECIALES L×A×H ─────────────────────────────────────
  // Solo permite: números, punto, coma, x, ×
  "dimensiones": { type: "dimensiones" },
};

// ── FUNCIONES DE CONSULTA ────────────────────────────────────────────────

/** Retorna el tipo de dato del campo. Por defecto "ambos" si no está mapeado. */
export function getFieldType(key: string): FieldDataType {
  return FIELD_TYPE_MAP[key as FieldKey]?.type ?? "ambos";
}

/** Retorna true si el campo admite decimales. */
export function allowsDecimals(key: string): boolean {
  const t = getFieldType(key);
  return t === "decimal2" || t === "decimal3" || t === "dimensiones";
}