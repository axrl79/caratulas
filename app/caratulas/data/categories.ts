// ─────────────────────────────────────────────────────────────────────────
// CATEGORÍAS Y DISCIPLINAS
// ─────────────────────────────────────────────────────────────────────────

import { Disciplina, Categoria } from "./types";

export const ESTRUCTURA_CATEGORIAS: Record<string, Disciplina[]> = {
  "Estructural":           ["Proyectos Estructurales", "Certificados de Estabilidad Estructural"],
  "Sanitario":             ["Proyectos Sanitarios / Certificados de Validación Sanitaria"],
  "Geológico - Geotécnico":["Estudios Geotécnicos Geológicos"],
  "Eléctrico":             ["Proyectos de Instalación Eléctricos", "Peritajes Eléctricos"],
  "Mecánico":              ["Proyectos Mecánicos"],
  "Ingeniería en General": ["Planes de Contingencia", "Informes"],
};

export const CATEGORIAS: Categoria[] = [

  // ══════════════════════════════════════════════════════════════
  // ESTRUCTURAL – PROYECTOS
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Proyectos Estructurales", code: "PES1",
    label: "Proyecto Estructural – Edificación",
    titulo_caratula: "PROYECTO ESTRUCTURAL", subtitulo_caratula: "– Edificación",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "superfConstruir","areaMuroCon","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos Estructurales", code: "PES2",
    label: "Proyecto Estructural – Muro de Contención",
    titulo_caratula: "PROYECTO ESTRUCTURAL", subtitulo_caratula: "– Muro de Contención",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","altMuro",
             "areaMuroCon","areaMuroHA","areaMuroHC","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos Estructurales", code: "PES3",
    label: "Proyecto Estructural – Puente o Viaducto",
    titulo_caratula: "PROYECTO ESTRUCTURAL", subtitulo_caratula: "– Puente o Viaducto",
    hasPlanos: true,
    active: ["coordenadas","municipio","luzPuente","superfTableroCon","areaMuroEst","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos Estructurales", code: "PES4",
    label: "Proyecto Estructural – Refuerzo Estructural",
    titulo_caratula: "PROYECTO ESTRUCTURAL", subtitulo_caratula: "– Refuerzo Estructural",
    hasPlanos: true,
    active: ["coordenadas","municipio","superfReforzar","areaMuroRef","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // ESTRUCTURAL – CERTIFICADOS
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Certificados de Estabilidad Estructural", code: "CEE1",
    label: "Certificado de Estabilidad Estructural – Edificación",
    titulo_caratula: "CERTIFICADO DE ESTABILIDAD ESTRUCTURAL", subtitulo_caratula: "– Edificación",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "superfConstruida","areaMuro","normaVerif",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Certificados de Estabilidad Estructural", code: "CEE2",
    label: "Certificado de Estabilidad Estructural Sismorresistente – Edificación",
    titulo_caratula: "CERTIFICADO DE ESTABILIDAD ESTRUCTURAL", subtitulo_caratula: "– Sismorresistente – Edificación",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "superfConstruida","areaMuro","normaVerif",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Certificados de Estabilidad Estructural", code: "CEE3",
    label: "Certificado de Estabilidad Estructural – Puente o Viaducto",
    titulo_caratula: "CERTIFICADO DE ESTABILIDAD ESTRUCTURAL", subtitulo_caratula: "– Puente o Viaducto",
    solocopias: true,
    active: ["coordenadas","municipio","luzPuente","superfTablero","areaEstribos","normaVerif",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Certificados de Estabilidad Estructural", code: "CEE4",
    label: "Certificado de Estabilidad Estructural – Muro de Contención",
    titulo_caratula: "CERTIFICADO DE ESTABILIDAD ESTRUCTURAL", subtitulo_caratula: "– Muro de Contención",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","altMuro",
             "areaMuro","areaMuroHA","areaMuroHC","normaVerif",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Certificados de Estabilidad Estructural", code: "CEE5",
    label: "Certificado de Estabilidad Estructural Sismorresistente – Muro de Contención",
    titulo_caratula: "CERTIFICADO DE ESTABILIDAD ESTRUCTURAL", subtitulo_caratula: "– Sismorresistente – Muro de Contención",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","altMuro",
             "areaMuro","areaMuroHA","areaMuroHC","normaVerif",
             "interesado","ingNombre","rni","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // SANITARIO
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Proyectos Sanitarios / Certificados de Validación Sanitaria", code: "PSA1",
    label: "Proyecto Hidro Sanitario – Edificación",
    titulo_caratula: "PROYECTO SANITARIO", subtitulo_caratula: "– Edificación",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","niveles","numArtefactos",
             "superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos Sanitarios / Certificados de Validación Sanitaria", code: "PSA2",
    label: "Proyecto Saneamiento Básico – Urbanización",
    titulo_caratula: "PROYECTO SANITARIO", subtitulo_caratula: "– Urbanización",
    hasPlanos: true,
    active: ["coordenadas","longSistema","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos Sanitarios / Certificados de Validación Sanitaria", code: "PSA3",
    label: "Certificado de Validación de Sistemas HidroSanitario – Edificación",
    titulo_caratula: "CERTIFICADO DE VALIDACIÓN SANITARIA", subtitulo_caratula: "– Edificación",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","niveles","numArtefactos",
             "superfConstruida","normaVerif",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // GEOLÓGICO – GEOTÉCNICO
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Estudios Geotécnicos Geológicos", code: "EGG1",
    label: "Estudio Geotécnico y Geológico – Edificación Proyectada",
    titulo_caratula: "ESTUDIO GEOTÉCNICO GEOLÓGICO", subtitulo_caratula: "– Edificación Proyectada",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","niveles","volMovTierras","superfTerreno","normaAplicacion",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Estudios Geotécnicos Geológicos", code: "EGG2",
    label: "Estudio Geotécnico y Geológico – Edificación Existente",
    titulo_caratula: "ESTUDIO GEOTÉCNICO GEOLÓGICO", subtitulo_caratula: "– Edificación Existente",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","niveles","superfTerreno","normaAplicacion",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Estudios Geotécnicos Geológicos", code: "EGG3",
    label: "Estudio Geotécnico y Geológico – Urbanización",
    titulo_caratula: "ESTUDIO GEOTÉCNICO GEOLÓGICO", subtitulo_caratula: "– Urbanización",
    solocopias: true,
    active: ["coordenadas","municipio","volMovTierras","superfProspeccion","normaAplicacion",
             "interesado","ingNombre","rni","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // ELÉCTRICO – PROYECTOS
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Proyectos de Instalación Eléctricos", code: "PRE1",
    label: "Proyecto de Instalación Eléctrica – Red Doméstica",
    titulo_caratula: "PROYECTO DE INSTALACIÓN ELÉCTRICA", subtitulo_caratula: "– Red Doméstica",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos de Instalación Eléctricos", code: "PRE2",
    label: "Proyecto de Instalación Eléctrica – Red de Edificación",
    titulo_caratula: "PROYECTO DE INSTALACIÓN ELÉCTRICA", subtitulo_caratula: "– Red de Edificación",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos de Instalación Eléctricos", code: "PRE3",
    label: "Proyecto de Instalación Eléctrica – Red Industrial",
    titulo_caratula: "PROYECTO DE INSTALACIÓN ELÉCTRICA", subtitulo_caratula: "– Red Industrial",
    hasPlanos: true,
    active: ["coordenadas","municipio",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos de Instalación Eléctricos", code: "PRE4",
    label: "Proyecto de Instalación Eléctrica – De Alta Potencia",
    titulo_caratula: "PROYECTO DE INSTALACIÓN ELÉCTRICA", subtitulo_caratula: "– De Alta Potencia",
    hasPlanos: true,
    active: ["coordenadas","municipio",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Proyectos de Instalación Eléctricos", code: "PRE5",
    label: "Proyecto de Instalación Eléctrica – Actividad Económica",
    titulo_caratula: "PROYECTO DE INSTALACIÓN ELÉCTRICA", subtitulo_caratula: "– Actividad Económica",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // ELÉCTRICO – PERITAJES
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Peritajes Eléctricos", code: "PEL1",
    label: "Peritaje Eléctrico – Red Doméstica",
    titulo_caratula: "PERITAJE ELÉCTRICO", subtitulo_caratula: "– Red Doméstica",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Peritajes Eléctricos", code: "PEL2",
    label: "Peritaje Eléctrico – Red de Edificación",
    titulo_caratula: "PERITAJE ELÉCTRICO", subtitulo_caratula: "– Red de Edificación",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Peritajes Eléctricos", code: "PEL3",
    label: "Peritaje Eléctrico – Red Industrial",
    titulo_caratula: "PERITAJE ELÉCTRICO", subtitulo_caratula: "– Red Industrial",
    hasPlanos: true,
    active: ["coordenadas","municipio",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Peritajes Eléctricos", code: "PEL4",
    label: "Peritaje Eléctrico – De Alta Potencia",
    titulo_caratula: "PERITAJE ELÉCTRICO", subtitulo_caratula: "– De Alta Potencia",
    hasPlanos: true,
    active: ["coordenadas","municipio",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },
  {
    disciplina: "Peritajes Eléctricos", code: "PEL5",
    label: "Peritaje Eléctrico – Actividad Económica",
    titulo_caratula: "PERITAJE ELÉCTRICO", subtitulo_caratula: "– Actividad Económica",
    hasPlanos: true,
    active: ["coordenadas","municipio","zona","calle",
             "potenciaInst","potenciaDem","tensionAlim","superfConstruir","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // MECÁNICO
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Proyectos Mecánicos", code: "PMC1",
    label: "Proyecto Mecánico – Diseño",
    titulo_caratula: "PROYECTO MECÁNICO", subtitulo_caratula: "– Diseño",
    hasPlanos: true,
    active: ["ubicacionInst","coordenadas","pesoTotal","dimensiones",
             "fuenteEnergia","funcionPrincipal","norma",
             "interesado","ingNombre","rni","tienePlanos","numPlanos","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // INGENIERÍA EN GENERAL – PLANES DE CONTINGENCIA
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Planes de Contingencia", code: "PLC1",
    label: "Plan de Contingencia – Edificación",
    titulo_caratula: "PLAN DE CONTINGENCIA", subtitulo_caratula: "– Edificación",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","niveles",
             "volMovTierras","volDemolicion","superfConstruir","normaAplicacion",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Planes de Contingencia", code: "PLC2",
    label: "Plan de Contingencia – Muro de Contención",
    titulo_caratula: "PLAN DE CONTINGENCIA", subtitulo_caratula: "– Muro de Contención",
    solocopias: true,
    active: ["coordenadas","municipio","zona","calle","altMuro",
             "volMovTierras","volDemolicion","normaAplicacion",
             "interesado","ingNombre","rni","numCopias"],
  },

  // ══════════════════════════════════════════════════════════════
  // INGENIERÍA EN GENERAL – INFORMES
  // ══════════════════════════════════════════════════════════════

  {
    disciplina: "Informes", code: "INT1",
    label: "Informe Técnico",
    titulo_caratula: "INFORME TÉCNICO", subtitulo_caratula: "– General",
    solocopias: true,
    active: ["coordenadas","municipio","normaAplicacion",
             "interesado","ingNombre","rni","numCopias"],
  },
  {
    disciplina: "Informes", code: "INP1",
    label: "Informe Pericial",
    titulo_caratula: "INFORME PERICIAL", subtitulo_caratula: "– General",
    solocopias: true,
    // Campos completamente distintos: no usa localización estándar
    active: ["distritoJudicial","nurej","normaAplicacion","nombreJuzgado",
             "ingNombre","rni","numCopias"],
  },
];