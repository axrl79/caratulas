"use client";

import { useEffect, useRef, useState } from "react";
import { Categoria, CATEGORY_LOGOS, ESTRUCTURA_CATEGORIAS } from "./data/diccionarios";

const MAP_FIELDS: string[] = ["coordenadas", "municipio", "zona", "calle"];

const UPLOAD_KEYS = ["memorias", "planos", "planosArq"] as const;
type UploadKey = typeof UPLOAD_KEYS[number];

interface GuideContent {
  title: string;
  description: string;
  example?: string;
  table?: { headers: string[]; rows: string[][] };
  notes?: string[];
  mainCatKey?: string;
  image?: { src: string; alt: string; caption?: string };
  images?: { src: string; alt: string; caption?: string }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL DE GUÍAS
// ═══════════════════════════════════════════════════════════════════════════
function getDynamicGuide(key: string, cat: Categoria | null): GuideContent | null {

  // ── 1. CATEGORÍAS PRINCIPALES ────────────────────────────────────────────
  const MAIN_CAT_GUIDES: Record<string, GuideContent> = {
    "Estructural": {
      title: "Especialidad: Estructural",
      description: "Comprende los proyectos y cálculos de la estructura portante de edificaciones, muros de contención, puentes y otras obras civiles. Incluye el diseño de sistemas resistentes a cargas gravitacionales y sísmicas conforme a normativa boliviana.",
      notes: ["Abarca: Proyectos Estructurales y Certificados de Estabilidad Estructural."],
      mainCatKey: "Estructural",
    },
    "Sanitario": {
      title: "Especialidad: Sanitario",
      description: "Abarca los diseños de redes de agua potable, alcantarillado sanitario y pluvial, y sistemas de tratamiento. Incluye proyectos hidro-sanitarios para edificaciones y urbanizaciones, así como certificados de validación de sistemas.",
      notes: ["Abarca: Proyectos Sanitarios y Certificados de Validación Sanitaria."],
      mainCatKey: "Sanitario",
    },
    "Geológico - Geotécnico": {
      title: "Especialidad: Geológico - Geotécnico",
      description: "Estudios del comportamiento del suelo y subsuelo para determinar la capacidad portante, clasificación de suelos y riesgos geológicos. Son requisito previo para cualquier proyecto de edificación o urbanización en la SIB.",
      notes: ["Abarca: Estudios Geotécnicos y Geológicos para edificaciones proyectadas, existentes, urbanizaciones y otros."],
      mainCatKey: "Geológico - Geotécnico",
    },
    "Eléctrico": {
      title: "Especialidad: Eléctrico",
      description: "Proyectos de redes e instalaciones eléctricas en baja, media y alta tensión, iluminación, redes domésticas e industriales. También incluye peritajes eléctricos para verificar instalaciones existentes.",
      notes: ["Abarca: Proyectos de Instalación Eléctrica y Peritajes Eléctricos."],
      mainCatKey: "Eléctrico",
    },
    "Mecánico": {
      title: "Especialidad: Mecánico",
      description: "Proyectos de instalaciones electromecánicas, diseño y cálculo de sistemas de ascensores, montacargas, bombeo y climatización. Cubre tanto el diseño de nuevas instalaciones como la revisión de equipos existentes.",
      notes: ["Abarca: Proyectos Mecánicos de diseño e instalación."],
      mainCatKey: "Mecánico",
    },
    "Ingeniería en General": {
      title: "Ingeniería en General",
      description: "Documentos técnicos transversales a varias ramas de la ingeniería. Incluye planes de contingencia ante emergencias y riesgos, así como informes técnicos y periciales requeridos por entidades públicas o privadas.",
      notes: ["Abarca: Planes de Contingencia e Informes Técnicos / Periciales."],
      mainCatKey: "Ingeniería en General",
    },
  };
  if (MAIN_CAT_GUIDES[key]) return MAIN_CAT_GUIDES[key];

  // ── 2. DISCIPLINAS SECUNDARIAS ───────────────────────────────────────────
  const DISCIPLINE_GUIDES: Record<string, GuideContent> = {
    "Proyectos Estructurales": { title: "Proyectos Estructurales", description: "Documentos de diseño estructural que contemplan memoria de cálculo, planos estructurales y especificaciones técnicas." },
    "Certificados de Estabilidad Estructural": { title: "Certificados de Estabilidad Estructural", description: "Documentos emitidos por el ingeniero proyectista certificando que una estructura cumple con las normas de estabilidad y resistencia." },
    "Proyectos Sanitarios / Certificados de Validación Sanitaria": { title: "Proyectos Sanitarios / Certificados de Validación", description: "Diseño de instalaciones sanitarias y certificados que validan el cumplimiento de normativa de saneamiento básico." },
    "Estudios Geotécnicos Geológicos": { title: "Estudios Geotécnicos Geológicos", description: "Investigación del subsuelo mediante ensayos de campo y laboratorio para determinar la capacidad portante y recomendar el tipo de cimentación." },
    "Proyectos de Instalación Eléctricos": { title: "Proyectos de Instalación Eléctrica", description: "Diseño de redes eléctricas internas y externas para uso doméstico, comercial o industrial conforme al Reglamento Eléctrico Boliviano." },
    "Peritajes Eléctricos": { title: "Peritajes Eléctricos", description: "Evaluación técnica de instalaciones eléctricas existentes para verificar su estado, seguridad y cumplimiento normativo." },
    "Proyectos Mecánicos": { title: "Proyectos Mecánicos", description: "Diseño e ingeniería de sistemas mecánicos en edificaciones: ascensores, bombeo, climatización y ventilación." },
    "Planes de Contingencia": { title: "Planes de Contingencia", description: "Documentos que establecen procedimientos de respuesta ante emergencias en edificaciones o infraestructura." },
    "Informes": { title: "Informes Técnicos y Periciales", description: "Documentos técnicos elaborados por ingenieros para describir, analizar o dictaminar sobre situaciones de ingeniería." },
  };
  if (DISCIPLINE_GUIDES[key]) return DISCIPLINE_GUIDES[key];

  // ── 3. FORMATOS DE PROYECTO OFICIAL ─────────────────────────────────────
  const FORMATO_GUIDES: Record<string, GuideContent> = {
    // PES
    "Proyecto Estructural – Edificación":          { title: "PES1 – Proyecto Estructural: Edificación",          description: "Para proyectos de edificaciones nuevas. Requiere memoria de cálculo, planos estructurales y especificaciones técnicas." },
    "Proyecto Estructural – Muro de Contención":   { title: "PES2 – Proyecto Estructural: Muro de Contención",   description: "Para muros de contención nuevos. Requiere cálculo de empuje de tierras y estabilidad al volteo/deslizamiento." },
    "Proyecto Estructural – Puente o Viaducto":    { title: "PES3 – Proyecto Estructural: Puente o Viaducto",    description: "Para puentes vehiculares o peatonales. Incluye análisis de cargas vivas (AASHTO), vigas, tablero, estribos y pilas." },
    "Proyecto Estructural – Refuerzo Estructural": { title: "PES4 – Proyecto Estructural: Refuerzo Estructural", description: "Para estructuras existentes que requieren intervención para mejorar resistencia o ductilidad." },
    // CEE
    "Certificado de Estabilidad Estructural – Edificación":                      { title: "CEE1 – Certificado de Estabilidad: Edificación",            description: "Certifica que una edificación cumple con las normas de estabilidad estructural vigentes." },
    "Certificado de Estabilidad Estructural Sismorresistente – Edificación":     { title: "CEE2 – Certificado Sismorresistente: Edificación",           description: "Certifica el cumplimiento de la normativa sismorresistente boliviana para edificaciones." },
    "Certificado de Estabilidad Estructural – Puente o Viaducto":               { title: "CEE3 – Certificado de Estabilidad: Puente o Viaducto",       description: "Certificación de estabilidad para puentes existentes o proyectados." },
    "Certificado de Estabilidad Estructural – Muro de Contención":              { title: "CEE4 – Certificado de Estabilidad: Muro de Contención",      description: "Certifica la estabilidad de muros de contención verificando factores de seguridad." },
    "Certificado de Estabilidad Estructural Sismorresistente – Muro de Contención": { title: "CEE5 – Certificado Sismorresistente: Muro de Contención", description: "Certificación del comportamiento sísmico de muros de contención." },
    // PSA
    "Proyecto Hidro Sanitario – Edificación":                            { title: "PSA1 – Proyecto Hidro Sanitario: Edificación",          description: "Diseño de instalaciones de agua potable, desagüe y pluviales para edificaciones." },
    "Proyecto Saneamiento Básico – Urbanización":                        { title: "PSA2 – Proyecto Saneamiento Básico: Urbanización",       description: "Diseño de redes de agua potable y alcantarillado para urbanizaciones." },
    "Certificado de Validación de Sistemas HidroSanitario – Edificación":{ title: "PSA3 – Certificado de Validación Sanitaria: Edificación", description: "Certifica que las instalaciones sanitarias de una edificación cumplen normativa vigente." },
    // EGG
    "Estudio Geotécnico y Geológico – Edificación Proyectada": { title: "EGG1 – Estudio Geotécnico: Edificación Proyectada", description: "Investigación del subsuelo para definir la cimentación de una edificación nueva." },
    "Estudio Geotécnico y Geológico – Edificación Existente":  { title: "EGG2 – Estudio Geotécnico: Edificación Existente",  description: "Evaluación de condiciones del suelo bajo una edificación ya construida." },
    "Estudio Geotécnico y Geológico – Urbanización":           { title: "EGG3 – Estudio Geotécnico: Urbanización",           description: "Estudio del subsuelo a nivel de una urbanización completa." },
    // PRE
    "Proyecto de Instalación Eléctrica – Red Doméstica":      { title: "PRE1 – Instalación Eléctrica: Red Doméstica",      description: "Proyecto de instalación eléctrica residencial de baja tensión." },
    "Proyecto de Instalación Eléctrica – Red de Edificación": { title: "PRE2 – Instalación Eléctrica: Red de Edificación", description: "Para edificaciones multifamiliares o de uso mixto con tableros generales y subtableros." },
    "Proyecto de Instalación Eléctrica – Red Industrial":     { title: "PRE3 – Instalación Eléctrica: Red Industrial",     description: "Instalaciones eléctricas para uso industrial con cargas de motores y protecciones." },
    "Proyecto de Instalación Eléctrica – De Alta Potencia":   { title: "PRE4 – Instalación Eléctrica: Alta Potencia",      description: "Para instalaciones de media o alta tensión y subestaciones eléctricas." },
    "Proyecto de Instalación Eléctrica – Actividad Económica":{ title: "PRE5 – Instalación Eléctrica: Actividad Económica",description: "Para locales comerciales, oficinas, hoteles, restaurantes y otros establecimientos." },
    // PEL
    "Peritaje Eléctrico – Red Doméstica":      { title: "PEL1 – Peritaje Eléctrico: Red Doméstica",      description: "Evaluación técnica de instalaciones eléctricas residenciales existentes." },
    "Peritaje Eléctrico – Red de Edificación": { title: "PEL2 – Peritaje Eléctrico: Red de Edificación", description: "Peritaje de instalaciones en edificaciones multifamiliares o comerciales." },
    "Peritaje Eléctrico – Red Industrial":     { title: "PEL3 – Peritaje Eléctrico: Red Industrial",     description: "Evaluación de instalaciones eléctricas industriales y puestas a tierra." },
    "Peritaje Eléctrico – De Alta Potencia":   { title: "PEL4 – Peritaje Eléctrico: Alta Potencia",      description: "Peritaje de sistemas de media/alta tensión y subestaciones eléctricas." },
    "Peritaje Eléctrico – Actividad Económica":{ title: "PEL5 – Peritaje Eléctrico: Actividad Económica",description: "Evaluación de instalaciones en locales comerciales o de servicios." },
    // PMC
    "Proyecto Mecánico – Diseño": { title: "PMC1 – Proyecto Mecánico: Diseño", description: "Diseño de sistemas mecánicos para edificaciones: ascensores, bombas, ventilación y climatización." },
    // PLC
    "Plan de Contingencia – Edificación":      { title: "PLC1 – Plan de Contingencia: Edificación",      description: "Procedimientos de evacuación y control de emergencias para edificaciones." },
    "Plan de Contingencia – Muro de Contención":{ title: "PLC2 – Plan de Contingencia: Muro de Contención",description: "Plan de respuesta ante falla de muro de contención con zonas de exclusión." },
    // INT - INP
    "Informe Técnico":  { title: "INT1 – Informe Técnico",  description: "Documento técnico para describir, analizar o recomendar sobre situaciones de ingeniería." },
    "Informe Pericial": { title: "INP1 – Informe Pericial", description: "Dictamen técnico con valor legal elaborado por perito ingeniero designado por la justicia." },
  };
  if (FORMATO_GUIDES[key]) return FORMATO_GUIDES[key];

  // ── 4. CAMPO TÍTULO — varía según categoría ──────────────────────────────
  if (key === "titulo") {
    const subtitulo = cat?.subtitulo_caratula || "";
    const code = cat?.code || "";

    if (subtitulo.includes("Muro de Contención") || subtitulo.includes("Muro de contención")) {
      return {
        title: "Título del Proyecto (Muro de Contención)",
        description: 'Debe escribirse el título entre comillas especificando que es un muro de contención.',
        example: '"Muro de Contención de Edificio Nueva Luz"',
      };
    }
    if (subtitulo.includes("Puente")) {
      return {
        title: "Título del Proyecto (Puente)",
        description: 'Debe escribirse el título del puente entre comillas.',
        example: '"Puente de Estrecho de Tiquina"',
      };
    }
    if (subtitulo.includes("Refuerzo Estructural")) {
      return {
        title: "Título del Proyecto (Refuerzo Estructural)",
        description: 'Debe escribirse el título entre comillas especificando que se trata de un refuerzo.',
        example: '"Refuerzo Estructural de Edificio Nueva Luz"',
      };
    }
    if (subtitulo.includes("Urbanización") || subtitulo.includes("Urbanizacion")) {
      return {
        title: "Título del Proyecto (Urbanización)",
        description: 'Debe escribirse el nombre de la urbanización entre comillas.',
        example: '"Urbanización La Nueva Esperanza"',
      };
    }
    if (["PRE5", "PEL5"].includes(code)) {
      return {
        title: "Título del Proyecto (Actividad Económica)",
        description: 'Debe escribirse el nombre del establecimiento o actividad entre comillas.',
        example: '"Discoteca la Gran Noche"',
      };
    }
    if (["PRE3", "PRE4", "PEL3", "PEL4"].includes(code)) {
      return {
        title: "Título del Proyecto (Industrial / Alta Potencia)",
        description: 'Debe escribirse el nombre del proyecto industrial o de alta potencia entre comillas.',
        example: '"Plataforma Industrial el Nuevo Amanecer"',
        notes: ['También válido: "Hospital de Última Generación Centro"'],
      };
    }
    if (code === "PMC1") {
      return {
        title: "Título del Proyecto (Maquinaria / Mecánico)",
        description: 'Debe escribirse el nombre del equipo o sistema mecánico entre comillas.',
        example: '"Diseño de Máquina Empacadora"',
      };
    }
    if (["INT1", "INP1"].includes(code)) {
      return {
        title: "Título del Proyecto (Informe)",
        description: 'Debe escribirse el tipo y objeto del informe entre comillas.',
        example: '"Informe Técnico Pericial de Estructura de Edificio Nueva Luz"',
      };
    }
    if (["PLC1", "PLC2"].includes(code)) {
      return {
        title: "Título del Proyecto (Plan de Contingencia)",
        description: 'Debe escribirse el nombre del objeto o edificación del plan entre comillas.',
        example: '"Plan de Contingencia – Edificio Nueva Luz"',
      };
    }
    if (["EGG1", "EGG2", "EGG3"].includes(code)) {
      return {
        title: "Título del Proyecto (Estudio Geotécnico)",
        description: 'Debe escribirse el nombre del predio o proyecto objeto del estudio entre comillas.',
        example: '"Estudio Geotécnico Geológico – Edificio Nueva Luz"',
      };
    }
    if (["PSA1", "PSA2", "PSA3"].includes(code)) {
      return {
        title: "Título del Proyecto (Sanitario)",
        description: 'Debe escribirse el nombre del proyecto o edificación entre comillas.',
        example: '"Proyecto Hidro Sanitario – Edificio Nueva Luz"',
      };
    }
    // DEFAULT — Edificación (PES1, CEE1, CEE2, PRE1, PRE2, PEL1, PEL2)
    return {
      title: "Título del Proyecto (Edificación)",
      description: 'Debe incluir el título entre comillas y especificar el tipo de estructura del cuadro normativo entre paréntesis.',
      example: '"Edificio Nueva Luz" (tipo C-2)',
      table: {
        headers: ["TIPO", "TIPOLOGÍA", "ALTURA"],
        rows: [
          ["C-1",  "De interés social (Vivienda básica)",              "Hasta 3.5 m — Una planta"],
          ["",     "Simple (Vivienda privada)",                         "Hasta 4.5 m — Una planta y media"],
          ["C-2",  "Mediana (Vivienda uso mixto)",                      "Hasta 6.5 m — Planta baja y planta alta"],
          ["C-3",  "Medianamente compleja (Multifamiliar)",             "Hasta 12.5 m — Dos a cuatro plantas"],
          ["C-4a", "Compleja (Multifamiliar, oficinas, comercio)",      "Hasta 40 m — Cinco a diez plantas"],
          ["C-4b", "",                                                   "Hasta 60 m — Once a veinte plantas"],
          ["C-4c", "",                                                   "Mayores a 60 m o veinte plantas"],
          ["C-5",  "Edificaciones especiales",                          "Cualquier altura"],
        ],
      },
      notes: ["Fuente: Norma Boliviana de Estudios Geotécnicos."],
    };
  }

  // ── 5. CAMPOS CON VARIANTES POR CATEGORÍA ───────────────────────────────

  // areaMuroCon — PES1 (Edificación) | PES2 (Muro de Contención)
  if (key === "areaMuroCon") {
    const code = cat?.code || "";
    const tablaComun = {
      headers: ["N°", "H (m)", "L (m)", "TIPO", "¿PERTENECE AL BLOQUE ESTRUCTURAL?", "A (m²)"],
      rows: [
        ["1", "2.20",        "3.50",  "HºCº", "No (Muro perimetral)", "7.70"],
        ["2", "5.20 a 6.00", "10.00", "HºAº", "Sí",                   "55.00"],
        ["",  "",            "",      "",      "ÁREA TOTAL =",         "62.70"],
      ],
    };
    if (code === "PES2") {
      return {
        title: "Área de Muro de Contención a Construir (m²) — Muro de Contención",
        description: "Se debe considerar la sumatoria del área de los muros de contención a construir. El área se obtiene multiplicando la altura total del muro (incluyendo el desplante de la cimentación) por su longitud.",
        example: "62.70",
        table: tablaComun,
        notes: [
          "Altura y longitud con precisión de dos decimales.",
          "Se debe colocar un esquema en planta de la posición de los muros resaltados.",
          "El valor total se colocará en la carátula junto con el cuadro resumen obligatorio.",
        ],
      };
    }
    // PES1 — Edificación
    return {
      title: "Área de Muro de Contención a Construir (m²) — Edificación",
      description: "Se debe considerar la sumatoria del área de los muros de contención a construir. El área se obtiene multiplicando la altura total del muro (incluyendo el desplante de la cimentación) por su longitud.",
      example: "62.70",
      table: tablaComun,
      notes: [
        "Altura y longitud con precisión de dos decimales.",
        "Se debe colocar un esquema en planta de la posición de los muros resaltados.",
        "En caso de estructura sin muro de contención, indicar: \"no corresponde\" y no se adjunta el cuadro.",
        "El valor total se colocará en la carátula junto con el cuadro resumen obligatorio.",
      ],
    };
  }

  // areaMuro — CEE1, CEE2 (Edificación) | CEE4, CEE5 (Muro de Contención)
  if (key === "areaMuro") {
    const code = cat?.code || "";
    const esMuro = ["CEE4", "CEE5"].includes(code);
    const tablaComun = {
      headers: ["N°", "H (m)", "L (m)", "TIPO", "¿PERTENECE AL BLOQUE ESTRUCTURAL?", "A (m²)"],
      rows: [
        ["1", "2.20",        "3.50",  "HºCº", "No (Muro perimetral)", "7.70"],
        ["2", "5.20 a 6.00", "10.00", "HºAº", "Sí",                   "55.00"],
        ["",  "",            "",      "",      "ÁREA TOTAL =",         "62.70"],
      ],
    };
    if (esMuro) {
      return {
        title: "Área de Muro de Contención (m²) — Muro de Contención",
        description: "Se debe considerar la sumatoria del área de los muros de contención en metros cuadrados. El área se obtiene multiplicando la altura total del muro (incluyendo el desplante de la cimentación) por su longitud.",
        example: "62.70",
        table: tablaComun,
        notes: [
          "Altura y longitud con precisión de dos decimales.",
          "Se debe colocar un esquema en planta de la posición de los muros resaltados.",
          "El valor total se colocará en la carátula junto con el cuadro resumen obligatorio.",
        ],
      };
    }
    // CEE1, CEE2 — Edificación
    return {
      title: "Área de Muro de Contención (m²) — Edificación",
      description: "Se debe considerar la sumatoria del área de los muros de contención en metros cuadrados. El área se obtiene multiplicando la altura total del muro (incluyendo el desplante de la cimentación) por su longitud.",
      example: "62.70",
      table: tablaComun,
      notes: [
        "Altura y longitud con precisión de dos decimales.",
        "Se debe colocar un esquema en planta de la posición de los muros resaltados.",
        "En caso de estructura sin muro de contención, indicar: \"no corresponde\" y no se adjunta el cuadro.",
        "El valor total se colocará en la carátula junto con el cuadro resumen obligatorio.",
      ],
    };
  }

  // areaMuroHA y areaMuroHC — CEE4, CEE5 (Muro) | CEE1, CEE2... no usan estos campos
  // PES2 usa areaMuroHA y areaMuroHC para desglosar HºAº y HºCº del muro a construir
  if (key === "areaMuroHA") {
    const code = cat?.code || "";
    const esCertificado = ["CEE4", "CEE5"].includes(code);
    return {
      title: esCertificado
        ? "Área de Muro de Contención de Hormigón Armado (m²) — Certificado"
        : "Área de Muro de Contención de Hormigón Armado (m²) — Proyecto",
      description: "Área del muro construido con hormigón armado (con acero de refuerzo). Se obtiene de la sumatoria de los tramos de muro HºAº del cuadro de cálculo.",
      example: "45.00",
      notes: [
        "HºAº = Hormigón Armado (con acero de refuerzo).",
        "Expresar en metros cuadrados con dos decimales.",
        esCertificado
          ? "Corresponde al muro existente objeto de certificación."
          : "Corresponde al muro nuevo a construir.",
      ],
    };
  }

  if (key === "areaMuroHC") {
    const code = cat?.code || "";
    const esCertificado = ["CEE4", "CEE5"].includes(code);
    return {
      title: esCertificado
        ? "Área de Muro de Contención de Hormigón Ciclópeo (m²) — Certificado"
        : "Área de Muro de Contención de Hormigón Ciclópeo (m²) — Proyecto",
      description: "Área del muro construido con hormigón ciclópeo (con piedra grande embebida, sin acero de refuerzo). Se obtiene de la sumatoria de los tramos de muro HºCº del cuadro de cálculo.",
      example: "40.00",
      notes: [
        "HºCº = Hormigón Ciclópeo (sin acero, con piedra embebida).",
        "Expresar en metros cuadrados con dos decimales.",
        esCertificado
          ? "Corresponde al muro existente objeto de certificación."
          : "Corresponde al muro nuevo a construir.",
      ],
    };
  }

  // superfTableroCon — PES3 (Tablero a CONSTRUIR — Proyecto)
  if (key === "superfTableroCon") {
    return {
      title: "Superficie del Tablero a Construir (m²) — Proyecto Puente",
      description: "Superficie total del tablero del puente a construir, incluyendo el ancho completo que abarca bermas, carriles, aceras y demás elementos, multiplicado por la luz total del puente.",
      example: "538.56 m²  →  Ancho total (15.3 m) × Luz del puente (35.2 m) = 538.56 m²",
      image: {
        src: "/docs/img/imgsuptabcons.jpg",
        alt: "Diagrama de superficie del tablero del puente a construir",
        caption: "La superficie incluye bermas, carriles, aceras y demás elementos del ancho total.",
      },
      table: {
        headers: ["COMPONENTE", "DESCRIPCIÓN", "VALOR EJEMPLO"],
        rows: [
          ["Ancho total del tablero", "Bermas + carriles + aceras + elementos adicionales", "15.3 m"],
          ["Luz total del puente",    "Medida desde estribo inicial hasta estribo final",   "35.2 m"],
          ["Superficie del tablero",  "Ancho total × Luz total",                            "538.56 m²"],
        ],
      },
      notes: [
        "Expresar en metros cuadrados con dos decimales.",
        "El ancho debe incluir TODOS los elementos transversales: bermas, carriles, aceras, bordillos.",
        "La luz total debe coincidir con el campo Luz Total del Puente.",
        "Corresponde al tablero del puente a CONSTRUIR (proyecto nuevo).",
      ],
    };
  }

  // superfTablero — CEE3 (Tablero EXISTENTE — Certificado)
  if (key === "superfTablero") {
    return {
      title: "Superficie del Tablero (m²) — Certificado Puente",
      description: "Superficie total del tablero del puente existente, incluyendo el ancho completo (bermas, carriles, aceras) por la luz total del puente.",
      example: "538.56 m²  →  Ancho total (15.3 m) × Luz del puente (35.2 m) = 538.56 m²",
      table: {
        headers: ["COMPONENTE", "DESCRIPCIÓN", "VALOR EJEMPLO"],
        rows: [
          ["Ancho total del tablero", "Bermas + carriles + aceras + elementos adicionales", "15.3 m"],
          ["Luz total del puente",    "Medida desde estribo inicial hasta estribo final",   "35.2 m"],
          ["Superficie del tablero",  "Ancho total × Luz total",                            "538.56 m²"],
        ],
      },
      notes: [
        "Expresar en metros cuadrados con dos decimales.",
        "El ancho debe incluir TODOS los elementos transversales: bermas, carriles, aceras, bordillos.",
        "Corresponde al tablero del puente EXISTENTE (certificado).",
      ],
    };
  }

  // areaMuroEst — PES3 (Estribos a CONSTRUIR — Proyecto)
  if (key === "areaMuroEst") {
    return {
      title: "Área de Estribos a Construir (m²) — Proyecto Puente",
      description: "Se debe considerar la sumatoria del área de los estribos a construir. El área se obtiene multiplicando la altura total del estribo (incluyendo el desplante de la cimentación) por su longitud.",
      example: "62.70",
      table: {
        headers: ["N°", "H (m)", "L (m)", "TIPO", "POSICIÓN", "A (m²)"],
        rows: [
          ["1", "2.20",        "3.50",  "HºCº", "Estribo Izquierdo", "7.70"],
          ["2", "5.20 a 6.00", "10.00", "HºAº", "Estribo Derecho",   "55.00"],
          ["",  "",            "",      "",      "ÁREA TOTAL =",      "62.70"],
        ],
      },
      notes: [
        "Altura y longitud con precisión de dos decimales.",
        "Se debe colocar un esquema en planta de la posición de los estribos resaltados.",
        "El valor total se colocará en la carátula junto con el cuadro resumen obligatorio.",
        "Corresponde a los estribos del puente a CONSTRUIR (proyecto nuevo).",
      ],
    };
  }

  // areaEstribos — CEE3 (Estribos EXISTENTES — Certificado)
  if (key === "areaEstribos") {
    return {
      title: "Área de Estribos (m²) — Certificado Puente",
      description: "Se debe considerar la sumatoria del área de los estribos existentes del puente objeto de certificación.",
      example: "62.70",
      table: {
        headers: ["N°", "H (m)", "L (m)", "TIPO", "POSICIÓN", "A (m²)"],
        rows: [
          ["1", "2.20",        "3.50",  "HºCº", "Estribo Izquierdo", "7.70"],
          ["2", "5.20 a 6.00", "10.00", "HºAº", "Estribo Derecho",   "55.00"],
          ["",  "",            "",      "",      "ÁREA TOTAL =",      "62.70"],
        ],
      },
      notes: [
        "Altura y longitud con precisión de dos decimales.",
        "Se debe colocar un esquema en planta de la posición de los estribos.",
        "Corresponde a los estribos del puente EXISTENTE (certificado).",
      ],
    };
  }

  // ── 6. CAMPOS GENERALES (FIELD_GUIDES) ──────────────────────────────────
  const FIELD_GUIDES: Record<string, GuideContent> = {

    // ── Archivos ──
    "memorias": {
      title: "Memorias de Cálculo",
      description: "Documentos técnicos que respaldan los cálculos del proyecto. Deben incluir hipótesis de carga, resultados numéricos y conclusiones firmadas.",
      example: "Memoria_Calculo_Estructural.pdf",
      notes: ["Formato recomendado: PDF.", "Tamaño máximo: 50 MB.", "Puedes subir múltiples archivos."],
    },
    "planos": {
      title: "Planos de Ingeniería",
      description: "Planos técnicos del proyecto (estructurales, sanitarios, eléctricos u otros). Deben estar firmados y sellados por el proyectista.",
      example: "Plano_Estructural_PB.pdf / .dwg",
      notes: ["Formatos aceptados: PDF, DWG, DXF.", "Cada plano debe tener cuadro de rotulación completo."],
    },
    "planosArq": {
      title: "Planos Arquitectónicos",
      description: "Planos de arquitectura: distribución, cortes, fachadas y detalles constructivos. Necesarios para verificar concordancia con la especialidad.",
      example: "Plano_Arquitectonico_PB.pdf",
      notes: ["Formatos aceptados: PDF, DWG.", "Incluir planta de conjunto si aplica."],
    },

    // ── Localización ──
    "coordenadas": {
      title: "Coordenadas (Lat. – Long.)",
      description: "Se registrarán las coordenadas geodésicas en el sistema de referencia mundial WGS-84. Para proyectos con predio definido, se tomará como punto de referencia el centroide (centro geométrico) del mismo. Las coordenadas se expresarán en grados decimales con una precisión mínima de seis (6) decimales, utilizando el punto (.) como separador decimal. El formato de entrada será: Latitud, seguido de Longitud, separados estrictamente por punto y coma (;).",
      example: "-16.503487; -68.130420",
    },
    "municipio": {
      title: "Municipio",
      description: "Se deberá colocar el nombre oficial del Municipio donde se emplaza el proyecto, asegurando la correspondencia con la Provincia respectiva de acuerdo a la División Político-Administrativa del Estado Vigente.",
      example: "La Paz, El Alto, Viacha, Copacabana",
      notes: ["En caso de proyectos colindantes entre dos o más municipios, se deberá especificar el municipio donde se registre el proyecto."],
      table: {
        headers: ["PROVINCIA", "MUNICIPIOS"],
        rows: [
          ["Murillo",             "La Paz, El Alto, Palca, Mecapaca, Achocalla"],
          ["Omasuyos",            "Achacachi, Ancoraimes, Chua Cocani, Huarina, Santiago de Huata"],
          ["Ingavi",              "Viacha, Guaqui, Desaguadero, San Andrés de Machaca, Jesús de Machaca, Taraco, Tiwanaku"],
          ["Los Andes",           "Pucarani, Laja, Batallas, Puerto Pérez"],
          ["Aroma",               "Sica Sica, Umala, Ayo Ayo, Calamarca, Patacamaya, Colquencha, Collana"],
          ["Pacajes",             "Corocoro, Caquiaviri, Calacoto, Comanche, Charaña, Waldo Ballivián, Nazacara de Pacajes, Santiago de Callapa"],
          ["Manco Kapac",         "Copacabana, San Pedro de Tiquina, Tito Yupanqui"],
          ["Larecaja",            "Sorata, Guanay, Tipuani, Mapiri, Teoponte, Combaya, Quiabaya, Tacacoma"],
          ["Bautista Saavedra",   "Charazani, Curva"],
          ["Muñecas",             "Chuma, Ayata, Aucapata"],
          ["Camacho",             "Puerto Acosta, Mocomoco, Puerto Carabuco, Humanata, Escoma"],
          ["Franz Tamayo",        "Apolo, Pelechuco"],
          ["Loayza",              "Luribay, Sapahaqui, Yaco, Malla, Cairoma"],
          ["Inquisivi",           "Inquisivi, Quime, Cajuata, Colquiri, Ichoca, Licoma Pampa"],
          ["Sud Yungas",          "Chulumani, Irupana, Yanacachi, Palos Blancos, La Asunta"],
          ["Nor Yungas",          "Coroico, Coripata"],
          ["Iturralde",           "Ixiamas, San Buenaventura"],
          ["Caranavi",            "Caranavi, Alto Beni"],
          ["Gualberto Villarroel","Curahuara de Carangas, San Pedro de Curahuara, Papel Pampa"],
          ["José Manuel Pando",   "Santiago de Machaca, Catacora"],
        ],
      },
    },
    "zona": {
      title: "Zona",
      description: "Se deberá colocar la ubicación detallada del predio según corresponda al área urbana o rural.",
      example: "Distrito 3 / Sopocachi Alto",
      notes: [
        'Si no es posible especificar, colocar "No Corresponde".',
        "Áreas Urbanas: Indicar el número del Distrito Municipal y el nombre oficial de la Zona o Barrio, de acuerdo con el Certificado de Catastro o el Registro de Propiedad (Derechos Reales).",
        "Áreas Rurales o Dispersas: Indicar el nombre de la Comunidad, Localidad o Sector, además de la denominación del predio o propiedad si esta figurase en el Título Ejecutorial.",
      ],
      table: {
        headers: ["TIPO DE ÁREA", "FORMATO", "EJEMPLO"],
        rows: [
          ["Urbana", "[Distrito] / [Nombre de la Zona o Barrio]", "Distrito 3 / Sopocachi Alto"],
          ["Urbana", "[Distrito] / [Nombre de la Urbanización]",  "Distrito 3 / Urbanización Villa Caluyo"],
          ["Rural",  "[Comunidad o Localidad] / [Sector]",        "Comunidad Sancari / Sector B"],
        ],
      },
    },
    "calle": {
      title: "Calle",
      description: "Se deberá registrar la vía principal de acceso al predio según el tipo de área donde se ubica.",
      example: "Av. Panorámica esq. Calle Puerto Rico / S.N.",
      notes: [
        "Áreas Consolidadas: Indicar nombre de la Calle, Avenida o Pasaje y el número de inmueble oficial. Si no cuenta con número, colocar \"S.N.\" (Sin Número).",
        "Áreas en Expansión/Rurales: Indicar el nombre de la vía proyectada o la carretera/camino de acceso más cercano.",
        "Predios en Esquina: Es obligatorio consignar ambas vías.",
      ],
      table: {
        headers: ["CASO", "FORMATO", "EJEMPLO"],
        rows: [
          ["Con número",      "[Tipo de vía] [Nombre] N° [Número]",            "Av. Arce N° 2631"],
          ["Sin número",      "[Tipo de vía] [Nombre] S.N.",                   "Calle Bolívar S.N."],
          ["En esquina",      "[Vía principal] esq. [Vía secundaria] N°/S.N.", "Av. Panorámica esq. Calle Puerto Rico S.N."],
          ["Rural/Expansión", "[Carretera o camino de acceso más cercano]",    "Camino Vecinal a Mecapaca"],
        ],
      },
    },
    "ubicacionInst": {
      title: "Ubicación de Instalación",
      description: "Se debe colocar dirección o referencia del lugar en que se instalará el equipo o máquina.",
      example: "Av. Arce N°2631, Edificio Torres del Sol, Piso 3",
    },

    // ── Edificación ──
    "niveles": {
      title: "Número de Niveles",
      description: "Se deberá registrar el número total de niveles horizontales (losas/diafragmas) que componen la estructura. Se contabilizarán de forma integrada: Sótanos, Semisótanos, Planta Baja, Mezanines, Plantas Tipo, Terrazas y Cubiertas Accesibles. No se considera nivel de cimentación (zapatas) ni cubiertas no habitables de pendiente pronunciada.",
      example: "6 Niveles (2 Sótanos, 1 Planta Baja, 2 Plantas Altas y 1 Terraza accesible)",
      image: {
        src: "/docs/img/imgnumniveles.jpg",
        alt: "Diagrama de conteo de niveles en edificación",
        caption: "Criterio de conteo: se incluyen sótanos, planta baja, plantas tipo y terraza accesible. No se cuenta el nivel de fundación.",
      },
      table: {
        headers: ["NIVEL", "¿SE CUENTA?", "EJEMPLO"],
        rows: [
          ["Sótano / Semisótano",       "✅ Sí", "Sótano 1, Sótano 2"],
          ["Planta Baja",               "✅ Sí", "Planta Baja"],
          ["Mezanine",                  "✅ Sí", "Mezanine"],
          ["Planta Tipo / Alta",        "✅ Sí", "Planta 1, Planta 2"],
          ["Terraza Accesible",         "✅ Sí", "Terraza"],
          ["Nivel de Fundación/Zapata", "❌ No", "—"],
          ["Cubierta no habitable",     "❌ No", "Techo inclinado"],
        ],
      },
      notes: [
        "Formato: [Número Total] niveles ([Desglose detallado por uso]).",
        "La Planta Baja siempre cuenta como un nivel.",
        "Los sótanos y semisótanos se especifican entre paréntesis en el desglose.",
      ],
    },

    // ── Superficies ──
    "superfConstruir": {
      title: "Superficie a Construir (m²)",
      description: "Se debe consignar la superficie total a construir en metros cuadrados, la cual deberá coincidir con la cantidad indicada en los planos arquitectónicos. En caso de existir discrepancias, el proyecto será observado.",
      example: "1526.58",
      notes: ["El valor deberá registrarse con una precisión de dos decimales."],
    },
    "superfConstruida": {
      title: "Superficie Construida (m²)",
      description: "Se debe consignar la superficie total construida en metros cuadrados, la cual deberá coincidir con la cantidad indicada en los planos arquitectónicos y plano de regularización. En caso de existir discrepancias, el proyecto será observado.",
      example: "1526.58",
      notes: ["El valor deberá registrarse con una precisión de dos decimales."],
    },
    "superfTerreno": {
      title: "Superficie del Terreno (m²)",
      description: "Área total del terreno donde se emplaza o emplazará el proyecto.",
      example: "450.00",
      notes: ["Expresar en metros cuadrados con dos decimales."],
    },
    "superfProspeccion": {
      title: "Superficie de Prospección (ha)",
      description: "Área total del terreno prospectado en el estudio geológico, expresada en hectáreas.",
      example: "1.250",
      notes: ["Expresar en hectáreas con tres decimales."],
    },
    "superfReforzar": {
      title: "Superficie a Reforzar (m²)",
      description: "Debe colocarse la superficie a reforzar según criterios de áreas de aporte. Se debe completar el Cuadro de Cálculo de Superficies de Elementos Estructurales a Reforzar detallando cada elemento por nivel.",
      example: "396 m²",
      images: [
        { src: "/docs/img/imgarecol.jpg", alt: "Criterio de área de aporte para columnas",    caption: "Columnas: Para columnas se debe tomar en cuenta el área de aporte de todos los niveles." },
        { src: "/docs/img/imgarevig.jpg", alt: "Criterio de área de aporte para vigas",       caption: "Vigas: Para vigas se debe identificar si la losa de aporte está dispuesta en una o dos direcciones, y se sigue el criterio de líneas de rotura de losas." },
        { src: "/docs/img/imgarelos.jpg", alt: "Criterio de área para losas y escaleras",     caption: "Losas/Escaleras: Considerar el área total delimitada por los apoyos. Si las vigas de apoyo también son reforzadas, el área de losa se mantiene independiente — contabilizar ambas áreas por separado." },
        { src: "/docs/img/imgarefun.jpg", alt: "Criterio de área para fundaciones",           caption: "Fundaciones: Colocar entre paréntesis las columnas que descargan a la fundación separadas por '/'. Ej: Z1(C1A/C1B)." },
      ],
      table: {
        headers: ["N°", "NOMBRE", "MATERIAL", "TIPO ELEMENTO", "NIVELES", "A (m²)"],
        rows: [
          ["1", "C1A",          "HA", "COLUMNA",       "Nivel 5 / Nivel 4 / Nivel 3 / Nivel 2 / Nivel 1", "20 / 25 / 30 / 35 / 40"],
          ["2", "V1",           "HA", "VIGA",           "Nivel 1",                                          "56"],
          ["3", "L1",           "HA", "LOSA",           "Nivel 2",                                          "100"],
          ["4", "Z1 (C1A/C1B)", "HA", "ZAPATA AISLADA", "Nivel 1 / Nivel 2 / Nivel 3 / Nivel 4",           "25 / 21 / 23 / 21"],
          ["",  "",             "",   "",                "ÁREA TOTAL =",                                     "396"],
        ],
      },
      notes: [
        "Columnas: tomar en cuenta el área de aporte de todos los niveles.",
        "Vigas: identificar si la losa de aporte está en una o dos direcciones, siguiendo el criterio de líneas de rotura.",
        "Losas/Escaleras: área total delimitada por los apoyos, independiente del refuerzo de vigas.",
        "Fundaciones: área de niveles vinculados. Si se refuerza la columna que transmite carga, no se contabiliza nuevamente.",
        "Descargar y completar el documento complementario: Cuadro de Superficies de Elementos Estructurales a Reforzar.",
      ],
    },

    // ── Muros ──
    "altMuro": {
      title: "Altura Máxima Total del Muro (m)",
      description: "Se registrará la altura total del elemento, correspondiente a la máxima medida entre todas las secciones del muro de contención estructural, expresada en metros y con una precisión de dos decimales.",
      example: "4.35",
      image: {
        src: "/docs/img/imgaltmurmax.jpg",
        alt: "Diagrama de criterio de medida de altura de muro de contención",
        caption: "H se mide desde el punto más bajo de la fundación (sin dentellón) hasta el coronamiento superior.",
      },
      table: {
        headers: ["CASO", "CRITERIO DE MEDIDA", "EJEMPLO"],
        rows: [
          ["Muro de Contención", "Desde el punto más bajo de la fundación (sin dentellón ni llaves de corte) hasta el coronamiento superior", "H = 4.35 m"],
          ["Muro en Edificación", "Suma de alturas de todos los niveles que atraviesa el muro + profundidad de desplante de su fundación",    "H = 3.00 + 1.35 = 4.35 m"],
        ],
      },
      notes: [
        "Expresar en metros con dos decimales (ej: 4.35, no 4.3 ni 4).",
        "No incluir el dentellón ni las llaves de corte en la medida.",
        "En caso de muro con altura variable, registrar la altura máxima.",
      ],
    },
    "areaMuroRef": {
      title: "Área de Muro de Contención a Reforzar (m²)",
      description: "Se debe considerar la sumatoria del área de los muros de contención que serán intervenidos, considerando la totalidad de la sección donde se realizará la intervención. El área se obtiene multiplicando la altura total del muro (incluyendo el desplante de la cimentación) por su longitud.",
      example: "62.70",
      table: {
        headers: ["N°", "H (m)", "L (m)", "TIPO", "¿PERTENECE AL BLOQUE ESTRUCTURAL?", "A (m²)"],
        rows: [
          ["1", "2.20",        "3.50",  "HºCº", "No (Muro perimetral)", "7.70"],
          ["2", "5.20 a 6.00", "10.00", "HºAº", "Sí",                   "55.00"],
          ["",  "",            "",      "",      "ÁREA TOTAL =",         "62.70"],
        ],
      },
      notes: [
        "Altura y longitud con precisión de dos decimales.",
        "Se debe colocar un esquema en planta de la posición de los muros resaltados.",
        "En caso de que el cálculo no considere refuerzo en muros, indicar: \"no corresponde\" y no se adjunta el cuadro.",
        "El valor total se colocará en la carátula junto con el cuadro resumen obligatorio.",
      ],
    },

    // ── Puentes ──
    "luzPuente": {
      title: "Luz Total del Puente (m)",
      description: "Se consignará la dimensión longitudinal del puente medida sobre el Eje de Simetría o Eje de Proyecto en Planta. La Longitud Total es la suma de todas las luces parciales, medida desde la cara interna del estribo inicial hasta la cara interna del estribo final.",
      example: "120.45",
      image: {
        src: "/docs/img/imgluzpue.jpg",
        alt: "Diagrama de medición de luz total del puente",
        caption: "La luz se mide desde la cara interna del estribo inicial hasta la cara interna del estribo final sobre el eje de proyecto.",
      },
      table: {
        headers: ["CASO", "CRITERIO DE MEDIDA", "EJEMPLO"],
        rows: [
          ["Puente Recto",          "Distancia desde cara interna de estribo inicial hasta cara interna de estribo final sobre el eje", "L = 120.45 m"],
          ["Puente Curvo",          "Medición siguiendo la prolongación del arco del eje, no la distancia lineal entre apoyos",         "L = arco = 135.20 m"],
          ["Puente con varias luces","Suma de todas las luces parciales entre apoyos intermedios",                                      "L = 40.00 + 40.45 + 40.00 = 120.45 m"],
        ],
      },
      notes: [
        "Expresar en metros con dos decimales (ej: 120.45, no 120.4 ni 120).",
        "En puentes curvos NO usar la distancia lineal entre apoyos.",
        "Formato de llenado: Longitud Total: [valor] m",
      ],
    },

    // ── Volúmenes ──
    "volMovTierras": {
      title: "Volumen de Movimiento de Tierras (m³)",
      description: "Volumen total de tierra a excavar, rellenar o mover durante la ejecución del proyecto.",
      example: "320.50",
      notes: ["Expresar en metros cúbicos con dos decimales."],
    },
    "volDemolicion": {
      title: "Volumen de Demolición (m³)",
      description: "Volumen total de material a demoler en la estructura existente.",
      example: "75.00",
      notes: ["Expresar en metros cúbicos con dos decimales."],
    },

    // ── Sanitario ──
    "numArtefactos": {
      title: "Número de Artefactos",
      description: "Se deberá consignar el número total de artefactos sanitarios destinados al consumo de agua y/o a la evacuación de desechos. Se debe completar el Cuadro de Cálculo de Número de Artefactos, registrando la cantidad por cada nivel de la edificación.",
      example: "63",
      table: {
        headers: ["NIVEL", "BEBEDERO", "DUCHA", "GRIFO/LLAVE RIEGO", "INODORO", "MÁQ. LAVAR", "LAVAMANOS", "LAVANDERÍA", "LAVAPLATOS", "TINA", "URINARIO", "OTRO"],
        rows: [
          ["Planta Baja",    "1", "2", "5",  "1", "1", "—", "5",  "2", "1", "—", "—"],
          ["Primera Planta", "—", "3", "4",  "1", "—", "2", "—",  "1", "—", "2", "—"],
          ["Segunda Planta", "—", "3", "2",  "2", "3", "—", "3",  "2", "—", "3", "—"],
          ["Tercera Planta", "—", "—", "3",  "3", "—", "4", "2",  "2", "—", "—", "—"],
          ["TOTAL = 63",     "1", "8", "14", "7", "4", "6", "10", "7", "1", "5", "0"],
        ],
      },
      notes: [
        "Únicamente se contabilizarán artefactos de uso funcional (inodoros, lavamanos, duchas, lavaplatos, entre otros).",
        "NO incluir: rejillas de piso, cámaras de inspección ni cajas interceptoras.",
        "Validación: el sumatorio total debe coincidir estrictamente con la Memoria de Cálculo Hidrosanitaria.",
        "El total debe estar relacionado con el número de Unidades de Gasto (UG) del proyecto.",
        "Descargar y completar el documento complementario: Cuadro de Cálculo de Número de Artefactos.",
      ],
    },
    "longSistema": {
      title: "Longitud Total del Sistema (km)",
      description: "Se registrará la longitud acumulada de la red expresada en kilómetros (km), con una precisión de tres decimales. Esta cifra debe ser el resultado de la sumatoria de los tramos detallados en el Cuadro de Longitudes del Sistema. La longitud se computará conforme a la proyección horizontal del sistema.",
      example: "4.951",
      table: {
        headers: ["JERARQUÍA DE RED", "IDENTIFICADOR / SECTOR", "DIÁMETRO O DIMENSIONES", "MATERIAL", "LONGITUD (km)"],
        rows: [
          ["Red Primaria",   "Eje Principal",                     '4" / 6" / 8" / 12"',  "PVC SDR 41", "1.036"],
          ["Red Secundaria", "Sector 1 – Manzanos del 1 al 10",   '4" / 6"',             "PEAD",        "0.554"],
          ["Red Secundaria", "Sector 2 – Manzanos del 10 al 20",  '4" / 6" / 8"',        "PVC SDR 41", "1.381"],
          ["Red Secundaria", "Sector 3 – Manzanos del 20 al 30",  '4" / 6" / 8" / 12"', "PVC SDR 41", "1.980"],
          ["",               "",                                   "",                    "LONGITUD TOTAL =", "4.951"],
        ],
      },
      image: {
        src: "/docs/img/imglongsis.png",
        alt: "Esquema de red primaria y secundaria del sistema sanitario",
        caption: "Red Primaria: columna vertebral de transporte. Red Secundaria: tuberías de recolección o distribución que aportan a la red principal.",
      },
      notes: [
        "Expresar en kilómetros con tres decimales (ej: 4.951, no 4.95 ni 5).",
        "Red Primaria: línea continua de mayor grosor; constituye la columna vertebral de transporte.",
        "Red Secundaria: tuberías, canales o elementos de recolección o distribución que aportan a la red principal.",
        "Descargar y completar el documento complementario: Cuadro de Longitudes del Sistema.",
      ],
    },

    // ── Eléctrico ──
    "potenciaInst": {
      title: "Potencia Instalada (kW)",
      description: "Suma de todas las potencias de los equipos eléctricos instalados en el sistema.",
      example: "45.5",
      notes: ["Expresar en kilowatts con un decimal mínimo."],
    },
    "potenciaDem": {
      title: "Potencia Demandada (kVA)",
      description: "Potencia máxima que demandará el sistema en condiciones normales de operación.",
      example: "38.2",
      notes: ["Expresar en kilovoltamperios con un decimal mínimo."],
    },
    "tensionAlim": {
      title: "Tensión de Alimentación (V)",
      description: "Tensión nominal del sistema de alimentación eléctrica.",
      example: "220 / 380",
      notes: ["Para sistemas monofásicos indicar solo el valor (ej: 220V). Para sistemas trifásicos indicar ambos (ej: 220/380V)."],
    },

    // ── Mecánico ──
    "pesoTotal": {
      title: "Peso Total ±5% (kg)",
      description: "Peso total del equipo o sistema mecánico con tolerancia del ±5%.",
      example: "1250.00",
      notes: ["Expresar en kilogramos con dos decimales.", "La tolerancia del ±5% debe estar justificada en la memoria de cálculo."],
    },
    "dimensiones": {
      title: "Dimensiones Principales L×A×H (m)",
      description: "Dimensiones principales del equipo: largo, ancho y alto en metros.",
      example: "2.5 × 1.8 × 3.2",
      notes: ["Formato: Largo × Ancho × Alto, en metros con un decimal mínimo."],
    },
    "fuenteEnergia": {
      title: "Fuente de Energía Principal",
      description: "Tipo de energía que alimenta el sistema mecánico.",
      example: "Eléctrica trifásica 380V",
    },
    "funcionPrincipal": {
      title: "Función Principal",
      description: "Descripción breve de la función o propósito principal del equipo o sistema.",
      example: "Ascensor de pasajeros para 8 personas",
    },

    // ── Normativa ──
    "norma": {
      title: "Norma de Diseño",
      description: "Normativa técnica bajo la cual fue elaborado el proyecto, priorizando la norma nacional boliviana. A falta de normativa nacional, se puede utilizar normativa extranjera. Las normas se separan por comas.",
      example: "CBH 87, NB 1225001, ACI 318, AASHTO LRFD",
      table: {
        headers: ["TIPO", "NORMA", "DESCRIPCIÓN"],
        rows: [
          ["Nacional",  "CBH 87",      "Código Boliviano del Hormigón"],
          ["Nacional",  "NB 1225001",  "Norma Boliviana Sismorresistente"],
          ["Extranjera","ACI 318-14",  "Código para Estructuras de Hormigón (EE.UU.)"],
          ["Extranjera","AASHTO LRFD", "Diseño por Factores de Carga y Resistencia"],
          ["Extranjera","ASCE 7",      "Cargas Mínimas para Edificaciones (EE.UU.)"],
        ],
      },
      notes: [
        "Priorizar siempre la normativa nacional boliviana.",
        "Las normas se separan por comas.",
      ],
    },
    "normaVerif": {
      title: "Norma de Verificación",
      description: "Debe colocarse la norma con la cual se verifican los diferentes elementos estructurales, priorizando la norma nacional. A falta de normativa nacional, se puede utilizar normativa extranjera. Las normas se separan por comas.",
      example: "CBH 87, NB 1225001, ACI 318-14, LRFD",
      table: {
        headers: ["TIPO", "NORMA", "DESCRIPCIÓN"],
        rows: [
          ["Nacional",  "CBH 87",      "Código Boliviano del Hormigón"],
          ["Nacional",  "NB 1225001",  "Norma Boliviana Sismorresistente"],
          ["Nacional",  "NB 1225002",  "Norma Boliviana de Estudios Geotécnicos"],
          ["Extranjera","ACI 318-14",  "Código para Estructuras de Hormigón (EE.UU.)"],
          ["Extranjera","LRFD",        "Diseño por Factores de Carga y Resistencia (AASHTO)"],
          ["Extranjera","CIRSOC 101",  "Reglamento Argentino de Cargas"],
          ["Extranjera","ASCE 7",      "Cargas Mínimas para Edificaciones (EE.UU.)"],
        ],
      },
      notes: [
        "Priorizar siempre la normativa nacional boliviana.",
        "En la memoria de cálculo se debe incluir normativa de cargas: tanto cargas permanentes como accidentales.",
        "A falta de normativa nacional para cargas, se puede utilizar normativa extranjera.",
        "Las normas se separan por comas. Ej: CBH 87, NB 1225001, ACI 318-14.",
      ],
    },
    "normaAplicacion": {
      title: "Norma Técnica de Aplicación",
      description: "Normativa técnica de aplicación específica para el estudio, plan de contingencia o informe elaborado. Priorizar la norma nacional boliviana.",
      example: "NB 1225002 (Geotécnica), NBE FL-90",
      notes: [
        "Para Estudios Geotécnicos: NB 1225002.",
        "Para Planes de Contingencia: normas de gestión de riesgos vigentes.",
        "Para Informes: normativa técnica del área específica del informe.",
      ],
    },

    // ── Responsables ──
    "interesado": {
      title: "Nombre del Interesado",
      description: "Nombre completo del propietario, representante legal o entidad solicitante.",
    },
    "ingNombre": {
      title: "Nombre Ing. Proyectista",
      description: "Nombre completo del ingeniero que elabora y firma el proyecto.",
    },
    "rni": {
      title: "RNI del Ingeniero Proyectista",
      description: "Número de Registro Nacional de Ingeniero (RNI) vigente emitido por la SIB.",
    },

    // ── Informe Pericial ──
    "distritoJudicial": {
      title: "Distrito Judicial",
      description: "En Distrito Judicial colocar la unidad de división territorial del caso asignado. Corresponde al departamento donde se tramita el proceso judicial.",
      example: "La Paz",
      notes: [
        "Ejemplos válidos: La Paz, Cochabamba, Santa Cruz, Oruro, Potosí, Chuquisaca, Tarija, Beni, Pando.",
      ],
    },
    "nurej": {
      title: "NUREJ",
      description: "Se deberá registrar obligatoriamente el Número de Registro Judicial (NUREJ) vigente, correspondiente al proceso jurisdiccional dentro del cual se emite el informe pericial.",
      example: "20145896",
      notes: [
        "El perito debe asegurar que el número coincida exactamente con el registro del Sistema Justicia Libre del Órgano Judicial.",
        "Formato: número de 10 a 13 dígitos según corresponda.",
        "No se aceptan guiones, espacios ni caracteres adicionales.",
      ],
      table: {
        headers: ["CASO", "FORMATO", "EJEMPLO"],
        rows: [
          ["NUREJ estándar",  "10 a 13 dígitos numéricos", "20145896"],
          ["NUREJ extendido", "Hasta 13 dígitos",           "2024000123456"],
        ],
      },
    },
    "nombreJuzgado": {
      title: "Nombre del Juzgado",
      description: "Denominación completa del juzgado o tribunal que solicita el peritaje.",
      example: "Juzgado 1° Civil de La Paz",
    },
  };

  return FIELD_GUIDES[key] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES Y TIPOS
// ═══════════════════════════════════════════════════════════════════════════
interface GeoResult {
  coordenadas: string;
  municipio: string;
  zona: string;
  calle: string;
}

interface FieldGuideProps {
  activeGuideKey: string | null;
  onFillFields?: (fields: any) => void;
  theme: any;
  isDark: boolean;
  cat?: Categoria | null;
  filesMemoria?: File[];
  setFilesMemoria?: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanos?: File[];
  setFilesPlanos?: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanosArq?: File[];
  setFilesPlanosArq?: React.Dispatch<React.SetStateAction<File[]>>;
  onClose?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAPA INTERACTIVO
// ═══════════════════════════════════════════════════════════════════════════
function MapSelector({ onSelect, theme, isDark }: { onSelect: (r: GeoResult) => void; theme: any; isDark: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isFetching = useRef(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<GeoResult | null>(null);
  const [status, setStatus] = useState("Haz clic en el mapa para ubicar");

  useEffect(() => {
    if (!mapRef.current) return;
    const initMap = (L: any) => {
      if (leafletRef.current) return;
      const container = mapRef.current;
      if (container && (container as any)._leaflet_id) (container as any)._leaflet_id = null;
      const map = L.map(container).setView([-16.4897, -68.1193], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
      setTimeout(() => map.invalidateSize(), 200);
      const icon = L.divIcon({
        html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:${theme.accent};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [24, 24], iconAnchor: [12, 24], className: "",
      });
      map.on("click", async (e: any) => {
        if (isFetching.current) return;
        isFetching.current = true;
        const { lat, lng } = e.latlng;
        setLoading(true); setStatus("Buscando dirección...");
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`, { headers: { "Accept-Language": "es" } });
          if (!res.ok) throw new Error("API Error");
          const data = await res.json();
          const addr = data.address || {};
          setInfo({
            coordenadas: `${lat.toFixed(6)}; ${lng.toFixed(6)}`,
            municipio: addr.city || addr.town || addr.municipality || addr.county || addr.state_district || "",
            zona: addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.hamlet || "",
            calle: addr.road ? `${addr.road} ${addr.house_number || ""}`.trim() : "",
          });
          setStatus("✅ Listo. (Clickea otro lugar si te equivocaste)");
        } catch { setStatus("❌ Error al obtener ubicación."); }
        finally { setLoading(false); isFetching.current = false; }
      });
      leafletRef.current = map;
    };
    if ((window as any).L) { initMap((window as any).L); }
    else {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => initMap((window as any).L);
      document.head.appendChild(script);
    }
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; markerRef.current = null; } };
  }, [theme.accent]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: loading ? "#d97706" : theme.accent, padding: "8px 12px", background: theme.cardBg, borderRadius: 8, fontWeight: 600, border: `1px solid ${theme.border}` }}>
        {loading ? "⏳ " : ""}{status}
      </div>
      <div ref={mapRef} style={{ width: "100%", height: 220, borderRadius: 12, overflow: "hidden", border: `2px solid ${theme.border}`, zIndex: 1 }} />
      {info && (
        <div style={{ background: theme.boxBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "16px", fontSize: 12 }}>
          <div style={{ color: theme.accent, fontWeight: 800, marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>📍 Datos detectados</div>
          {[{ label: "Coordenadas", val: info.coordenadas }, { label: "Municipio", val: info.municipio }, { label: "Zona", val: info.zona }, { label: "Calle", val: info.calle }].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: theme.textSec, fontWeight: 800, minWidth: 85 }}>{label}:</span>
              <span style={{ color: theme.textMain, fontWeight: 500 }}>{val || <em style={{ color: theme.textMuted }}>No detectado</em>}</span>
            </div>
          ))}
          <button
            onClick={() => { if (info) onSelect(info); }}
            style={{ marginTop: 12, width: "100%", background: theme.accent, color: isDark ? "#0a1a12" : "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
          >
            ✅ Llenar formulario con estos datos
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL DE CARGA DE ARCHIVOS
// ═══════════════════════════════════════════════════════════════════════════
function UploadPanel({ uploadKey, guide, theme, isDark, filesMemoria, setFilesMemoria, filesPlanos, setFilesPlanos, filesPlanosArq, setFilesPlanosArq }: {
  uploadKey: UploadKey; guide: GuideContent; theme: any; isDark: boolean;
  filesMemoria: File[]; setFilesMemoria: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanos: File[]; setFilesPlanos: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanosArq: File[]; setFilesPlanosArq: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const files = uploadKey === "memorias" ? filesMemoria : uploadKey === "planos" ? filesPlanos : filesPlanosArq;
  const setter = uploadKey === "memorias" ? setFilesMemoria : uploadKey === "planos" ? setFilesPlanos : setFilesPlanosArq;
  const addFiles = (incoming: FileList | null) => { if (!incoming) return; setter(prev => [...prev, ...Array.from(incoming)]); };
  const removeFile = (i: number) => setter(prev => prev.filter((_, idx) => idx !== i));
  const icons: Record<UploadKey, string> = { memorias: "🧮", planos: "📐", planosArq: "🏛️" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? theme.accent : theme.border}`,
          borderRadius: 16,
          background: dragOver ? (isDark ? "rgba(34,197,94,0.10)" : "rgba(16,185,129,0.07)") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
          padding: "36px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s ease",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>{dragOver ? "📂" : icons[uploadKey]}</div>
        <div style={{ fontSize: "0.9em", fontWeight: 700, color: theme.textMain, marginBottom: 6 }}>{dragOver ? "Suelta para agregar" : "Arrastra archivos aquí"}</div>
        <div style={{ fontSize: "0.78em", color: theme.textMuted, marginBottom: 16 }}>o haz clic para seleccionar desde tu equipo</div>
        <div style={{ display: "inline-block", background: theme.accent, color: isDark ? "#0a1a12" : "#fff", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: "0.82em" }}>+ Seleccionar archivos</div>
        <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
      </div>
      <button
        onClick={() => alert("Integración con Google Drive próximamente")}
        style={{ width: "100%", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 10, padding: "11px 16px", fontWeight: 700, fontSize: "0.82em", color: theme.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <svg width="16" height="16" viewBox="0 0 87.3 78" fill="none">
          <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5L6.6 66.85z" fill="#0066da"/>
          <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9 9 0 000 53h27.5L43.65 25z" fill="#00ac47"/>
          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.1L73.55 76.8z" fill="#ea4335"/>
          <path d="M43.65 25L57.4 1.2A9.06 9.06 0 0053.3.05H34C31.5.05 29.2 1.3 27.9 3.35L43.65 25z" fill="#00832d"/>
          <path d="M60.1 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L60.1 53z" fill="#2684fc"/>
          <path d="M73.4 26.5L60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.45 28h27.45c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z" fill="#ffba00"/>
        </svg>
        Subir desde Google Drive
      </button>
      {files.length > 0 && (
        <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${theme.border}`, fontSize: "0.78em", color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
            📁 {files.length} archivo{files.length > 1 ? "s" : ""}
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto", padding: "8px 10px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", marginBottom: 4, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 8, fontSize: "0.78em" }}>
                <span style={{ color: theme.textMain, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>📄 {f.name}</span>
                <span style={{ color: theme.textMuted, fontSize: "0.9em", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                  <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 800, fontSize: "1.1em", padding: "0 2px" }}>✕</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "18px" }}>
        <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>📌 Descripción</div>
        <p style={{ fontSize: 13, color: theme.textMain, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{guide.description}</p>
      </div>
      {guide.notes && guide.notes.length > 0 && (
        <div style={{ background: isDark ? "rgba(245,158,11,0.1)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "#fcd34d"}`, borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 11, color: "#d97706", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>⚠️ Notas</div>
          {guide.notes.map((note, i) => (
            <p key={i} style={{ fontSize: 12, color: isDark ? "#fcd34d" : "#92400e", margin: "0 0 6px 0", lineHeight: 1.6, fontWeight: 500 }}>• {note}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function FieldGuide({
  activeGuideKey, onFillFields, theme, isDark, cat,
  filesMemoria = [], setFilesMemoria,
  filesPlanos = [], setFilesPlanos,
  filesPlanosArq = [], setFilesPlanosArq,
  onClose,
}: FieldGuideProps) {
  const guide = activeGuideKey ? getDynamicGuide(activeGuideKey, cat || null) : null;
  const isMapField = activeGuideKey ? MAP_FIELDS.includes(activeGuideKey) : false;
  const isUploadKey = activeGuideKey ? (UPLOAD_KEYS as readonly string[]).includes(activeGuideKey) : false;
  const [showMap, setShowMap] = useState(false);

  useEffect(() => { setShowMap(false); }, [activeGuideKey]);

  const handleMapSelect = (result: GeoResult) => {
    if (onFillFields) onFillFields({ coordenadas: result.coordenadas, municipio: result.municipio, zona: result.zona, calle: result.calle });
  };

  // Determina la categoría principal para mostrar el logo
  const mainCatKey: string | null = isUploadKey ? null : (() => {
    if (guide?.mainCatKey) return guide.mainCatKey;
    if (cat?.disciplina) {
      const found = Object.keys(ESTRUCTURA_CATEGORIAS).find(catKey =>
        ESTRUCTURA_CATEGORIAS[catKey]?.includes(cat.disciplina as any)
      );
      if (found) return found;
    }
    if (activeGuideKey) {
      const found = Object.keys(ESTRUCTURA_CATEGORIAS).find(catKey =>
        catKey === activeGuideKey ||
        (ESTRUCTURA_CATEGORIAS[catKey] as string[])?.includes(activeGuideKey)
      );
      if (found) return found;
    }
    return null;
  })();

  const logoData = mainCatKey ? CATEGORY_LOGOS[mainCatKey] : null;
  const logoSrc = logoData ? (isDark ? logoData.dark : logoData.light) : null;

  return (
    <div style={{ width: "100%", height: "100%", background: theme.boxBg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes logoFadeIn  { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .fg-header {
          flex-shrink: 0; padding: 20px 24px;
          border-bottom: 1px solid ${theme.border};
          background: ${theme.headerGrad}; backdrop-filter: blur(10px);
        }
        .fg-body {
          flex: 1; overflow-y: auto; padding: 24px; scroll-behavior: smooth;
        }
        .fg-body::-webkit-scrollbar { width: 6px; }
        .fg-body::-webkit-scrollbar-track { background: transparent; }
        .fg-body::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 4px; }
        .fg-body::-webkit-scrollbar-thumb:hover { background: ${theme.accent}80; }
        .gt { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .gt th { background: ${theme.cardBg}; color: ${theme.textSec}; padding: 10px; text-align: left; border: 1px solid ${theme.border}; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
        .gt td { color: ${theme.textMain}; padding: 8px 10px; border: 1px solid ${theme.border}; vertical-align: top; line-height: 1.5; font-size: 12px; font-weight: 500; }
        .gt tr:nth-child(even) td { background: rgba(0,0,0,0.02); }
      `}</style>

      {/* ── HEADER ── */}
      <div className="fg-header">
        <div style={{ fontSize: 11, color: theme.accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontWeight: 800 }}>
          {isUploadKey ? "📎 Carga de Documentos" : "💡 Asistente S.I.B."}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            {logoSrc && !isUploadKey && (
              <div style={{
                flexShrink: 0, background: theme.cardBg, border: `1px solid ${theme.border}`,
                borderRadius: 10, padding: "6px 10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: theme.glow, animation: "logoFadeIn 0.4s ease",
              }}>
                <img src={logoSrc} alt={`Logo ${mainCatKey}`} style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
              </div>
            )}
            <div style={{ fontSize: 16, color: theme.textMain, fontWeight: 800, lineHeight: 1.3, minWidth: 0 }}>
              {guide?.title || activeGuideKey || "Panel de Ayuda"}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: theme.textMuted, fontSize: 24, cursor: "pointer", padding: "0 4px", lineHeight: 1, flexShrink: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* ── CUERPO SCROLLEABLE ── */}
      <div className="fg-body">
        {!guide && !isMapField && !isUploadKey ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.6, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>👆</div>
            <div style={{ color: theme.textMain, fontSize: 16, fontWeight: 600, padding: "0 20px" }}>
              Haz clic sobre un campo para ver su definición técnica aquí.
            </div>
          </div>
        ) : (
          <>
            {isUploadKey && guide && setFilesMemoria && setFilesPlanos && setFilesPlanosArq ? (
              <UploadPanel
                uploadKey={activeGuideKey as UploadKey} guide={guide}
                theme={theme} isDark={isDark}
                filesMemoria={filesMemoria} setFilesMemoria={setFilesMemoria}
                filesPlanos={filesPlanos} setFilesPlanos={setFilesPlanos}
                filesPlanosArq={filesPlanosArq} setFilesPlanosArq={setFilesPlanosArq}
              />
            ) : (
              <>
                {/* Mapa interactivo */}
                {isMapField && (
                  <div style={{ marginBottom: 24 }}>
                    {!showMap ? (
                      <div style={{ background: theme.cardBg, border: `1px dashed ${theme.border}`, borderRadius: 14, padding: "30px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                        <p style={{ color: theme.textSec, fontSize: 13, marginBottom: 20, fontWeight: 500 }}>El mapa autocompletará Municipio, Zona, Calle y Coordenadas.</p>
                        <button onClick={() => setShowMap(true)} style={{ background: theme.accent, color: isDark ? "#0a1a12" : "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                          🗺️ Cargar Mapa Interactivo
                        </button>
                      </div>
                    ) : (
                      <MapSelector onSelect={handleMapSelect} theme={theme} isDark={isDark} />
                    )}
                  </div>
                )}

                {/* Descripción */}
                {guide && (
                  <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "20px", marginBottom: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>📌 Descripción</div>
                    <p style={{ fontSize: 14, color: theme.textMain, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{guide.description}</p>
                  </div>
                )}

                {/* Imagen única */}
                {guide?.image && (
                  <div style={{ marginBottom: 20 }}>
                    <img src={guide.image.src} alt={guide.image.alt} style={{ width: "100%", borderRadius: 12, border: `1px solid ${theme.border}`, objectFit: "contain", display: "block" }} />
                    {guide.image.caption && (
                      <div style={{ fontSize: 11, color: theme.textMuted, textAlign: "center", marginTop: 8, fontStyle: "italic" }}>
                        {guide.image.caption}
                      </div>
                    )}
                  </div>
                )}

                {/* Múltiples imágenes */}
                {guide?.images && guide.images.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                    {guide.images.map((img, i) => (
                      <div key={i}>
                        <img src={img.src} alt={img.alt} style={{ width: "100%", borderRadius: 12, border: `1px solid ${theme.border}`, objectFit: "contain", display: "block" }} />
                        {img.caption && (
                          <div style={{ fontSize: 11, color: theme.textMuted, textAlign: "center", marginTop: 8, fontStyle: "italic" }}>
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Ejemplo */}
                {guide?.example && (
                  <div style={{ background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", border: `1px solid ${theme.border}`, borderRadius: 14, padding: "20px", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>✅ Ejemplo Práctico</div>
                    <pre style={{ fontSize: 13, color: isDark ? "#86efac" : "#166534", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.7, fontWeight: 600 }}>{guide.example}</pre>
                  </div>
                )}

                {/* Tabla */}
                {guide?.table && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>📊 Tabla de Referencia</div>
                    <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${theme.border}` }}>
                      <table className="gt">
                        <thead><tr>{guide.table.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                        <tbody>{guide.table.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notas */}
                {guide?.notes && guide.notes.length > 0 && (
                  <div style={{ background: isDark ? "rgba(245,158,11,0.1)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "#fcd34d"}`, borderRadius: 14, padding: "20px" }}>
                    <div style={{ fontSize: 11, color: "#d97706", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>⚠️ Notas de Normativa</div>
                    {guide.notes.map((note, i) => (
                      <p key={i} style={{ fontSize: 13, color: isDark ? "#fcd34d" : "#92400e", margin: "0 0 8px 0", lineHeight: 1.6, fontWeight: 500 }}>• {note}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}