// ─────────────────────────────────────────────────────────────────────────
// TIPOS FUNDAMENTALES
// ─────────────────────────────────────────────────────────────────────────

export type FieldKey =
  // Identificación y título
  | "titulo"
  // Localización
  | "coordenadas" | "municipio" | "zona" | "calle" | "ubicacionInst"
  // Edificación
  | "niveles"
  // Superficies
  | "superfConstruir" | "superfConstruida" | "superfTablero" | "superfTableroCon" | "superfReforzar"
  | "superfTerreno"   | "superfProspeccion"
  // Muros y estructuras
| "areaMuroCon" | "areaMuroRef" | "areaMuroHA" | "areaMuroHC" | "areaMuroEst" | "areaEstribos" | "areaMuro"
  // Puentes
  | "luzPuente"
  // Muros contención
  | "altMuro"
  // Volúmenes
  | "volMovTierras" | "volDemolicion"
  // Sanitario
  | "numArtefactos" | "longSistema"
  // Eléctrico
  | "potenciaInst" | "potenciaDem" | "tensionAlim"
  // Mecánico
  | "pesoTotal" | "dimensiones" | "fuenteEnergia" | "funcionPrincipal"
  // Normativa
  | "norma" | "normaVerif" | "normaAplicacion" 
  // Responsables
  | "interesado" | "ingNombre" | "rni"
  // Planos
  | "tienePlanos" | "numPlanos"
  // Copias
  | "numCopias"
// Informe Pericial exclusivos
  | "distritoJudicial" | "nurej" | "nombreJuzgado"
  // Ingeniería en General — Informes (INT1 / INP1)
  | "areaIngenieria" | "temaIngenieria";
export type Disciplina =
  | "Proyectos Estructurales"
  | "Certificados de Estabilidad Estructural"
  | "Proyectos Sanitarios / Certificados de Validación Sanitaria"
  | "Estudios Geotécnicos Geológicos"
  | "Proyectos de Instalación Eléctricos"
  | "Peritajes Eléctricos"
  | "Proyectos Mecánicos"
  | "Planes de Contingencia"
  | "Informes";

export interface Field {
  key: FieldKey;
  label: string;
  type: string;
  full?: boolean;
}

export interface Categoria {
  disciplina: Disciplina;
  code: string;
  label: string;
  titulo_caratula: string;
  subtitulo_caratula: string;
  active: FieldKey[];
  /** true = tiene sección de planos (check + numPlanos) */
  hasPlanos?: boolean;
  /** true = solo copias, sin planos */
  solocopias?: boolean;
}

export type FormData = Partial<Record<FieldKey, string>> & {
  /** Lista dinámica de interesados adicionales */
  interesados?: string[];
};

export type FieldRule = {
  required: boolean;
  decimals: boolean;
};