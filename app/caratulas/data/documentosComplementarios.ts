// ═══════════════════════════════════════════════════════════════
// DOCUMENTOS COMPLEMENTARIOS POR CATEGORÍA
// ═══════════════════════════════════════════════════════════════
//
// CÓMO AGREGAR UN ARCHIVO NUEVO:
// 1. Sube el PDF a la carpeta: /public/docs/
// 2. Agrega una entrada en DOCUMENTOS_COMPLEMENTARIOS con:
//    - id:       identificador único (sin espacios)
//    - nombre:   nombre que verá el usuario
//    - archivo:  ruta desde /public/ (ej: "docs/mi_archivo.pdf")
//              → si aún no está listo, pon null
//    - tipo:     "archivo" o "guia"
//    - categorias: lista de códigos donde debe aparecer
//
// CÓMO ACTIVAR UN ARCHIVO CUANDO ESTÉ LISTO:
//    Cambia:  archivo: null
//    Por:     archivo: "docs/nombre_del_archivo.pdf"
//
// ═══════════════════════════════════════════════════════════════

export type TipoDocumento = "archivo" | "guia";

export interface DocumentoComplementario {
  id: string;
  nombre: string;
  archivo: string | null; // null = aún no disponible, no se muestra
  tipo: TipoDocumento;
  categorias: string[];   // códigos de categoría: "PES1", "CEE1", etc.
}

export const DOCUMENTOS_COMPLEMENTARIOS: DocumentoComplementario[] = [

  // ── ARCHIVOS ────────────────────────────────────────────────

  {
    id: "cuadro_areas_muros",
    nombre: "Cuadro de Cálculo de Áreas de Muros de Contención",
    archivo: "docs/C- MUROS CONTENCION.docx", // → reemplazar con: "docs/cuadro_areas_muros.pdf"
    tipo: "archivo",
    categorias: ["PES1", "PES2", "PES4", "CEE1", "CEE2", "CEE4", "CEE5"],
  },
  {
    id: "cuadro_areas_estribos",
    nombre: "Cuadro de Cálculo de Áreas de Estribos",
    archivo: "docs/C - ESTRIBOS.docx",
    tipo: "archivo",
    categorias: ["PES3", "CEE3"],
  },
  {
    id: "cuadro_superficies_reforzar",
    nombre: "Cuadro de Cálculo de Superficies de Elementos Estructurales a Reforzar",
    archivo: "docs/C- REFUERZO.docx",
    tipo: "archivo",
    categorias: ["PES4"],
  },
  {
    id: "cuadro_artefactos",
    nombre: "Cuadro de Cálculo de Número de Artefactos",
    archivo: "docs/C- ARTEFACTOS.docx",
    tipo: "archivo",
    categorias: ["PSA1", "CSA1"],
  },
  {
    id: "cuadro_longitud_sistema",
    nombre: "Cuadro de Longitud Total del Sistema",
    archivo: "docs/C- LONG SISTEMA.docx",
    tipo: "archivo",
    categorias: ["PSA2"],
  },
  {
    id: "cuadro_coordenadas_poligono",
    nombre: "Cuadro de Coordenadas del Polígono del Área Analizada",
    archivo: null,
    tipo: "archivo",
    categorias: ["EGG3"],
  },
  {
    id: "cuadro_pesos_tolerancia",
    nombre: "Cuadro de Pesos Tolerancia Global de ± 5%",
    archivo: null,
    tipo: "archivo",
    categorias: ["PMC1"],
  },
  {
    id: "profesionales_colaboradores",
    nombre: "Profesionales Colaboradores del Proyecto",
    archivo: "docs/L- PROFESIONALES.docx",
    tipo: "archivo",
    categorias: ["PES1","PES2","PES3","PES4","CEE1","CEE2","CEE3","CEE4","CEE5","PSA1","PSA2","CSA1","INT1","INP1"],
  },
  {
    id: "esquema_planta",
    nombre: "Esquema en Planta del Área de Análisis",
    archivo: "docs/L- ESQUEMAS.docx",
    tipo: "archivo",
    categorias: ["CEE1", "CEE2"],
  },
  {
    id: "decl_jurada_cee_edificacion",
    nombre: "Declaración Jurada de Certificado de Estabilidad Estructural – Edificación",
    archivo: "docs/L- DECLARACION DE CERTIFICADO Edificacion vr1.docx",
    tipo: "archivo",
    categorias: ["CEE1", "CEE2"],
  },
  {
    id: "decl_jurada_cee_puente",
    nombre: "Declaración Jurada de Certificado de Estabilidad Estructural – Puente o Viaducto",
    archivo: "docs/L- DECLARACION DE CERTIFICADO Puente.docx",
    tipo: "archivo",
    categorias: ["CEE3"],
  },
  {
    id: "decl_jurada_cee_muro",
    nombre: "Declaración Jurada de Certificado de Estabilidad Estructural – Muro de Contención",
    archivo: "docs/L- DECLARACION DE CERTIFICADO Muro.docx",
    tipo: "archivo",
    categorias: ["CEE4", "CEE5"],
  },
  {
    id: "decl_jurada_pes",
    nombre: "Declaración Jurada",
    archivo: "docs/L- DECLARACION PROYECTO.docx",
    tipo: "archivo",
    categorias: ["PES1", "PES2", "PES3", "PES4"],
  },

  // ── GUÍAS ───────────────────────────────────────────────────

  {
    id: "guia_decl_jurada_pes",
    nombre: "Guía de Llenado de Declaración Jurada",
    archivo: "docs/G- DECLARACION PROYECTOS.docx",
    tipo: "guia",
    categorias: ["PES1", "PES2", "PES3", "PES4"],
  },
  {
    id: "guia_decl_jurada_cee_edificacion",
    nombre: "Guía Declaración Jurada de Certificado de Estabilidad Estructural – Edificación",
    archivo: "docs/G- DECLARACION DE CERTIFICADO Edificacion.docx",
    tipo: "guia",
    categorias: ["CEE1", "CEE2"],
  },
  {
    id: "guia_decl_jurada_cee_puente",
    nombre: "Guía Declaración Jurada de Certificado de Estabilidad Estructural – Puente o Viaducto",
    archivo: "docs/G- DECLARACION DE CERTIFICADO Puente.docx",
    tipo: "guia",
    categorias: ["CEE3"],
  },
  {
    id: "guia_decl_jurada_cee_muro",
    nombre: "Guía Declaración Jurada de Certificado de Estabilidad Estructural – Muro de Contención",
    archivo: "docs/G- DECLARACION DE CERTIFICADO Muro.docx",
    tipo: "guia",
    categorias: ["CEE4", "CEE5"],
  },
];