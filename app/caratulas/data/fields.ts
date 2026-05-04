// ─────────────────────────────────────────────────────────────────────────
// DEFINICIONES DE CAMPOS
// ─────────────────────────────────────────────────────────────────────────

import { FieldKey, Field } from "./types";

export const FIELDS: Field[] = [
  // ── Título ──
  { key: "titulo",            label: "Título del Proyecto",                              type: "text",   full: true },

  // ── Localización ──
  { key: "coordenadas",       label: "Coordenadas de Referencia (Lat. – Long.)",         type: "text",   full: true },
  { key: "municipio",         label: "Municipio",                                        type: "text" },
  { key: "zona",              label: "Zona",                                             type: "text" },
  { key: "calle",             label: "Calle",                                            type: "text" },
  { key: "ubicacionInst",     label: "Ubicación de Instalación",                         type: "text",   full: true },

  // ── Edificación ──
  { key: "niveles",           label: "Número de Niveles",                                type: "number" },

  // ── Superficies ──
  { key: "superfConstruir",   label: "Superficie a Construir (m²)",                      type: "number" },
  { key: "superfConstruida",  label: "Superficie Construida (m²)",                       type: "number" },
  { key: "superfTablero",     label: "Superficie del Tablero (m²)",                      type: "number" },
  { key: "superfTableroCon",  label: "Superficie del Tablero a Construir (m²)",          type: "number" },
  { key: "superfReforzar",    label: "Superficie a Reforzar (m²)",                       type: "number" },
  { key: "superfTerreno",     label: "Superficie del Terreno (m²)",                      type: "number" },
  { key: "superfProspeccion", label: "Superficie de Prospección (ha)",                   type: "number" },

  // ── Muros y estructuras ──
  { key: "areaMuroCon",       label: "Área de Muro de Contención a Construir (m²)",      type: "number" },
  { key: "areaMuroRef",       label: "Área de Muro de Contención a Reforzar (m²)",       type: "number" },
  { key: "areaMuro",          label: "Área de Muro de Contención (m²)",                  type: "number" },
  { key: "areaMuroHA",        label: "Área de Muro Hormigón Armado (m²)",                type: "number" },
  { key: "areaMuroHC",        label: "Área de Muro Hormigón Ciclópeo (m²)",              type: "number" },
  { key: "areaMuroEst",       label: "Área de Estribos a Construir (m²)",                type: "number" },
  { key: "areaEstribos",      label: "Área de Estribos (m²)",                            type: "number" },


  // ── Puentes ──
  { key: "luzPuente",         label: "Luz Total de Puente (m)",                          type: "number" },

  // ── Muros contención ──
  { key: "altMuro",           label: "Altura Máxima Total del Muro (m)",                 type: "number" },

  // ── Volúmenes ──
  { key: "volMovTierras",     label: "Volumen de Movimiento de Tierras (m³)",            type: "number" },
  { key: "volDemolicion",     label: "Volumen de Demolición (m³)",                       type: "number" },

  // ── Sanitario ──
  { key: "numArtefactos",     label: "Número de Artefactos",                             type: "number" },
  { key: "longSistema",       label: "Longitud Total del Sistema (km)",                  type: "number" },

  // ── Eléctrico ──
  { key: "potenciaInst",      label: "Potencia Instalada (kW)",                          type: "number" },
  { key: "potenciaDem",       label: "Potencia Demandada (kVA)",                         type: "number" },
  { key: "tensionAlim",       label: "Tensión de Alimentación Nominal (V)",              type: "number" },

  // ── Mecánico ──
  { key: "pesoTotal",         label: "Peso Total ±5% (kg)",                              type: "number" },
  { key: "dimensiones",       label: "Dimensiones Principales L×A×H (m)",               type: "text" },
  { key: "fuenteEnergia",     label: "Fuente de Energía Principal",                      type: "text" },
  { key: "funcionPrincipal",  label: "Función Principal",                                type: "text",   full: true },

  // ── Normativa ──
  { key: "norma",             label: "Norma de Diseño",                                  type: "text" },
  { key: "normaVerif",        label: "Norma de Verificación",                            type: "text" },
  { key: "normaAplicacion", label: "Norma Técnica de Aplicación",    type: "text" },

  // ── Informe Pericial ──
  { key: "distritoJudicial",  label: "Distrito Judicial",                                type: "text" },
  { key: "nurej",             label: "NUREJ",                                            type: "text" },
  { key: "nombreJuzgado",     label: "Nombre del Juzgado",                               type: "text",   full: true },
  { key: "areaIngenieria",    label: "Área de Ingeniería",                               type: "text" },
  { key: "temaIngenieria",    label: "Tema de Ingeniería",                               type: "text" },


  // ── Responsables ──
  { key: "interesado",        label: "Nombre del (de los) Interesado(s)",                type: "text",   full: true },
  { key: "ingNombre",         label: "Nombre Ing. Proyectista",                          type: "text" },
  { key: "rni",               label: "RNI del Ingeniero Proyectista",                    type: "text" },

  // ── Planos (lógica dinámica, no se renderizan como inputs normales) ──
  { key: "tienePlanos",       label: "Cuenta con Planos",                                type: "checkbox" },
  { key: "numPlanos",         label: "Número de Planos",                                 type: "number" },

  // ── Copias ──
  { key: "numCopias",         label: "Número de Copias",                                 type: "number" },


];

/** Campos que van en la sección "Responsables" */
export const personFields: FieldKey[] = ["interesado", "ingNombre", "rni"];

/** Campos especiales de control (no van en secciones normales) */
export const controlFields: FieldKey[] = ["tienePlanos", "numPlanos", "numCopias"];

/** Campos exclusivos del Informe Pericial */
export const peritajeFields: FieldKey[] = ["distritoJudicial", "nurej", "nombreJuzgado"];

export const QR_ORDER: FieldKey[] = [
  "titulo","coordenadas","municipio","zona","calle","ubicacionInst",
  "niveles","superfConstruir","superfConstruida","superfTablero","superfReforzar",
  "superfTerreno","superfProspeccion","areaMuroCon","areaMuroRef","areaMuro","areaMuroHA",
  "areaMuroHC","areaMuroEst","luzPuente","altMuro","volMovTierras","volDemolicion",
  "numArtefactos","longSistema","potenciaInst","potenciaDem","tensionAlim",
  "pesoTotal","dimensiones","fuenteEnergia","funcionPrincipal",
  "areaIngenieria","temaIngenieria",
  "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias",
];