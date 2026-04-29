"use client";

import { useEffect, useRef, useState } from "react";
import { Categoria, CATEGORY_LOGOS, ESTRUCTURA_CATEGORIAS } from "./data/diccionarios";

type GuideKey = string;

const MAP_FIELDS: string[] = ["coordenadas", "municipio", "zona", "calle"];

// Claves que corresponden a zonas de carga de archivos (paso 3)
const UPLOAD_KEYS = ["memorias", "planos", "planosArq"] as const;
type UploadKey = typeof UPLOAD_KEYS[number];

interface GuideContent {
  title: string;
  description: string;
  example?: string;
  table?: { headers: string[]; rows: string[][] };
  notes?: string[];
  mainCatKey?: string;
}

// ─── LÓGICA DINÁMICA DE GUÍAS ───
function getDynamicGuide(key: string, cat: Categoria | null): GuideContent | null {

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

  const DISCIPLINE_GUIDES: Record<string, GuideContent> = {
    "Proyectos Estructurales": { title: "Proyectos Estructurales", description: "Documentos de diseño estructural que contemplan memoria de cálculo, planos estructurales y especificaciones técnicas. Se aplican a edificaciones nuevas, muros de contención, puentes, refuerzos y otras estructuras especiales." },
    "Certificados de Estabilidad Estructural": { title: "Certificados de Estabilidad Estructural", description: "Documentos emitidos por el ingeniero proyectista certificando que una estructura existente o proyectada cumple con las normas de estabilidad y resistencia. Requeridos para trámites de regularización ante el GAMLP y otras entidades." },
    "Proyectos Sanitarios / Certificados de Validación Sanitaria": { title: "Proyectos Sanitarios / Certificados de Validación", description: "Incluye tanto el diseño de instalaciones sanitarias (agua, desagüe, pluviales) para edificaciones y urbanizaciones, como los certificados que validan que dichas instalaciones cumplen con la normativa de saneamiento básico vigente." },
    "Estudios Geotécnicos Geológicos": { title: "Estudios Geotécnicos Geológicos", description: "Investigación del subsuelo mediante ensayos de campo y laboratorio (SPT, granulometría, Proctor, etc.) para determinar la capacidad portante y recomendar el tipo de cimentación adecuado según la Norma Boliviana de Estudios Geotécnicos." },
    "Proyectos de Instalación Eléctricos": { title: "Proyectos de Instalación Eléctrica", description: "Diseño de redes eléctricas internas y externas para uso doméstico, comercial o industrial. Incluye memoria descriptiva, cálculo de cargas, planos unifilares y especificaciones de materiales conforme al Reglamento Eléctrico Boliviano." },
    "Peritajes Eléctricos": { title: "Peritajes Eléctricos", description: "Evaluación técnica de instalaciones eléctricas existentes para verificar su estado, seguridad y cumplimiento normativo. Generalmente solicitados por aseguradoras, juzgados o propietarios ante siniestros o disputas técnicas." },
    "Proyectos Mecánicos": { title: "Proyectos Mecánicos", description: "Diseño e ingeniería de sistemas mecánicos en edificaciones: ascensores, montacargas, sistemas de bombeo, climatización y ventilación. Requieren memoria de cálculo y planos de instalación aprobados por la SIB." },
    "Planes de Contingencia": { title: "Planes de Contingencia", description: "Documentos que establecen procedimientos de respuesta ante emergencias (incendios, sismos, inundaciones) en edificaciones o infraestructura. Son obligatorios para edificios de uso público, hospitales, colegios y estructuras de alta ocupación." },
    "Informes": { title: "Informes Técnicos y Periciales", description: "Documentos técnicos elaborados por ingenieros para describir, analizar o dictaminar sobre el estado, causa o solución de situaciones constructivas o de infraestructura. Los informes periciales tienen valor legal ante instancias judiciales o administrativas." },
  };

  if (DISCIPLINE_GUIDES[key]) return DISCIPLINE_GUIDES[key];

  const FORMATO_GUIDES: Record<string, GuideContent> = {
    "Proyecto Estructural – Edificación": { title: "PES1 – Proyecto Estructural: Edificación", description: "Para proyectos de edificaciones nuevas (viviendas, edificios de oficinas, uso mixto, etc.). Requiere memoria de cálculo estructural, planos de cimentación, columnas, vigas y losas, y especificaciones técnicas." },
    "Proyecto Estructural – Muro de Contención": { title: "PES2 – Proyecto Estructural: Muro de Contención", description: "Aplica para muros de contención nuevos en taludes, predios con desnivel o estabilización de terrenos. Requiere cálculo de empuje de tierras, estabilidad al volteo/deslizamiento y capacidad del suelo de fundación." },
    "Proyecto Estructural – Puente o Viaducto": { title: "PES3 – Proyecto Estructural: Puente o Viaducto", description: "Para el diseño estructural de puentes vehiculares o peatonales. Incluye análisis de cargas vivas (AASHTO), cálculo de vigas, tablero, estribos y pilas." },
    "Proyecto Estructural – Refuerzo Estructural": { title: "PES4 – Proyecto Estructural: Refuerzo Estructural", description: "Para estructuras existentes que requieren intervención para mejorar su resistencia o ductilidad. Incluye diagnóstico estructural, propuesta de refuerzo y verificación normativa." },
    
    "Certificados de Estabilidad Estructural – Edificación": { title: "CEE1 – Certificado de Estabilidad: Edificación", description: "Certifica que una edificación proyectada o existente cumple con las normas de estabilidad estructural vigentes. Requerido para trámites de planos aprobados ante el GAMLP." },
    "Certificados de Estabilidad Estructural – Sismorresistente - Edificación": { title: "CEE2 – Certificado Sismorresistente: Edificación", description: "Certifica específicamente el cumplimiento de la normativa sismorresistente boliviana para edificaciones. Exigido en zonas de alto riesgo sísmico o para edificaciones de importancia especial." },
    "Certificados de Estabilidad Estructural – Puente o Viaducto": { title: "CEE3 – Certificado de Estabilidad: Puente o Viaducto", description: "Certificación de estabilidad para puentes existentes o proyectados. Incluye la verificación de capacidad de carga y estado actual de la estructura." },
    "Certificados de Estabilidad Estructural – Muro de Contención": { title: "CEE4 – Certificado de Estabilidad: Muro de Contención", description: "Certifica la estabilidad de muros de contención existentes o proyectados, verificando factores de seguridad al volteo, deslizamiento y capacidad portante." },
    "Certificados de Estabilidad Estructural – Sismorresistente - Muro de Contención": { title: "CEE5 – Certificado Sismorresistente: Muro de Contención", description: "Certificación específica del comportamiento sísmico de muros de contención, considerando las fuerzas inerciales adicionales generadas durante un sismo." },
    
    "Proyecto Hidro Sanitario – Edificación": { title: "PSA1 – Proyecto Hidro Sanitario: Edificación", description: "Diseño de instalaciones de agua potable, desagüe y pluviales para edificaciones. Incluye isométricos sanitarios, cálculo de tuberías y especificaciones de aparatos sanitarios." },
    "Proyecto Saneamiento Basico – Urbanización": { title: "PSA2 – Proyecto Saneamiento Básico: Urbanización", description: "Diseño de redes de agua potable y alcantarillado para lotizaciones o urbanizaciones nuevas. Requiere coordinación con EPSAS u operadora local." },
    "Certificado de Validación de Sistemas HidroSanitario – Edificación": { title: "PSA3 – Certificado de Validación Sanitaria: Edificación", description: "Certifica que las instalaciones sanitarias de una edificación cumplen con las normas y reglamentos técnicos de saneamiento básico." },
    
    "Estudio Geotécnico y Geológico – Edificación Proyectada": { title: "EGG1 – Estudio Geotécnico: Edificación Proyectada", description: "Investigación del subsuelo para definir la cimentación de una edificación nueva. Incluye ensayos SPT o calicatas, análisis de laboratorio y recomendaciones de cimentación." },
    "Estudio Geotécnico y Geológico – Edificación Existente": { title: "EGG2 – Estudio Geotécnico: Edificación Existente", description: "Evaluación de las condiciones del suelo bajo una edificación ya construida, generalmente para ampliar, reforzar o verificar su estado ante problemas de asentamiento." },
    "Estudio Geotécnico y Geológico – Urbanización": { title: "EGG3 – Estudio Geotécnico: Urbanización", description: "Estudio del subsuelo a nivel de una lotización o urbanización completa, evaluando la aptitud del terreno para edificación y determinando zonas de riesgo." },
   
    "Proyecto de Instalación Eléctrica – Red Doméstica": { title: "PRE1 – Instalación Eléctrica: Red Doméstica", description: "Proyecto de instalación eléctrica residencial de baja tensión. Incluye cuadro de cargas, diagrama unifilar, circuitos de iluminación y tomacorrientes conforme al Reglamento Eléctrico Boliviano." },
    "Proyecto de Instalación Eléctrica – Red de Edificación": { title: "PRE2 – Instalación Eléctrica: Red de Edificación", description: "Para edificaciones multifamiliares o de uso mixto. Incluye diseño de tableros generales, subtableros por piso y sistemas de medición individualizada." },
    "Proyecto de Instalación Eléctrica – Red Industrial": { title: "PRE3 – Instalación Eléctrica: Red Industrial", description: "Instalaciones eléctricas para uso industrial: plantas, talleres, almacenes. Considera cargas de motores, protecciones industriales y puesta a tierra." },
    "Proyecto de Instalación Eléctrica – De Alta Potencia": { title: "PRE4 – Instalación Eléctrica: Alta Potencia", description: "Para instalaciones de media o alta tensión, subestaciones eléctricas y sistemas de distribución de gran escala." },
    "Proyecto de Instalación Eléctrica – Actividad Económica": { title: "PRE5 – Instalación Eléctrica: Actividad Económica", description: "Proyectos eléctricos para locales comerciales, oficinas, hoteles, restaurantes y otros establecimientos con actividad económica." },
    
    "Peritaje Eléctrico – Red Doméstico": { title: "PEL1 – Peritaje Eléctrico: Red Doméstica", description: "Evaluación técnica de instalaciones eléctricas residenciales existentes, verificando seguridad, estado de conductores, protecciones y puesta a tierra." },
    "Peritaje Eléctrico – Red de Edificación": { title: "PEL2 – Peritaje Eléctrico: Red de Edificación", description: "Peritaje de instalaciones eléctricas en edificaciones multifamiliares o comerciales, incluyendo tableros, conductores y sistemas de emergencia." },
    "Peritaje Eléctrico – Red Industrial": { title: "PEL3 – Peritaje Eléctrico: Red Industrial", description: "Evaluación de instalaciones eléctricas industriales, con especial atención a protecciones, puestas a tierra industriales y continuidad operativa." },
    "Peritaje Eléctrico – De Alta Potencia": { title: "PEL4 – Peritaje Eléctrico: Alta Potencia", description: "Peritaje de sistemas de media/alta tensión y subestaciones eléctricas, verificando el estado de equipos de maniobra, transformadores y protecciones." },
    "Peritaje Eléctrico – Actividad Económica": { title: "PEL5 – Peritaje Eléctrico: Actividad Económica", description: "Evaluación de instalaciones eléctricas en locales comerciales o de servicios, frecuentemente solicitado por aseguradoras o para renovación de licencias." },
    
    "Proyecto Mecánico – Diseño": { title: "PMC1 – Proyecto Mecánico: Diseño", description: "Diseño de sistemas mecánicos para edificaciones: ascensores, montacargas, bombas de agua, ventilación mecánica y climatización. Incluye memoria de cálculo y planos de instalación." },
    
    "Plan de Contingencia – Edificación": { title: "PLC1 – Plan de Contingencia: Edificación", description: "Documento que establece los procedimientos de evacuación, control de emergencias y brigadas de respuesta para edificaciones. Obligatorio para edificios con alta concurrencia de público." },
    "Plan de Contingencia – Muro de contención": { title: "PLC2 – Plan de Contingencia: Muro de Contención", description: "Plan específico de respuesta ante el colapso o falla inminente de un muro de contención, incluyendo zonas de exclusión y procedimientos de alerta temprana." },
    "Informe Técnico": { title: "INT1 – Informe Técnico", description: "Documento técnico elaborado por un ingeniero para describir, analizar o recomendar sobre situaciones constructivas, de infraestructura o de ingeniería. Tiene valor técnico ante entidades públicas o privadas." },
    "Informe Pericial": { title: "INP1 – Informe Pericial", description: "Dictamen técnico con valor legal elaborado por un perito ingeniero designado por la justicia o las partes. Se utiliza en procesos judiciales, arbitrajes o reclamaciones de seguros." },
  };

  if (FORMATO_GUIDES[key]) return FORMATO_GUIDES[key];

  if (key === "titulo") {
    const subtitulo = cat?.subtitulo_caratula || "";
    if (subtitulo.includes("Muro de Contención")) return { title: "Título del Proyecto (Muro de Contención)", description: "Debe escribirse el título entre comillas especificando que es un muro de contención.", example: '"Muro de Contención de Edificio Nueva Luz"' };
    if (subtitulo.includes("Puente")) return { title: "Título del Proyecto (Puente)", description: "Debe escribirse el título del puente entre comillas.", example: '"Puente de Estrecho de Tiquina"' };
    if (subtitulo.includes("Refuerzo Estructural")) return { title: "Título del Proyecto (Refuerzo Estructural)", description: "Debe escribirse el título entre comillas especificando que se trata de un refuerzo.", example: '"Refuerzo Estructural de Edificio Nueva Luz"' };
    if (subtitulo.includes("Otras Estructuras")) return { title: "Título del Proyecto (Otras Estructuras)", description: "Debe escribirse el título descriptivo de la estructura especial entre comillas.", example: '"Tanque Elevado de Hormigón Armado Urbanización Nueva Luz"' };
    return {
      title: "Título del Proyecto (Edificación)",
      description: "Debe incluir el título entre comillas y especificar el tipo de estructura del cuadro normativo entre paréntesis.",
      example: '"Edificio Nueva Luz" (tipo C-2)',
      table: {
        headers: ["TIPO", "TIPOLOGÍA", "ALTURA"],
        rows: [
          ["C-1", "De interés social (Vivienda básica)", "Hasta 3.5 m — Una planta"],
          ["", "Simple (Vivienda privada)", "Hasta 4.5 m — Una planta y media"],
          ["C-2", "Mediana (Vivienda uso mixto)", "Hasta 6.5 m — Planta baja y planta alta"],
          ["C-3", "Medianamente compleja (Multifamiliar)", "Hasta 12.5 m — Dos a cuatro plantas"],
          ["C-4a", "Compleja (Multifamiliar, oficinas, comercio)", "Hasta 40 m — Cinco a diez plantas"],
          ["C-4b", "", "Hasta 60 m — Once a veinte plantas"],
          ["C-4c", "", "Mayores a 60 m o veinte plantas"],
          ["C-5", "Edificaciones especiales", "Cualquier altura"],
        ],
      },
      notes: ["Fuente: Norma Boliviana de Estudios Geotécnicos."],
    };
  }

  const FIELD_GUIDES: Record<string, GuideContent> = {
    "memorias": {
      title: "Memorias de Cálculo",
      description: "Documentos técnicos que respaldan los cálculos estructurales, sanitarios, eléctricos u otros del proyecto. Deben incluir hipótesis de carga, resultados numéricos, normativa aplicada y conclusiones firmadas por el profesional responsable.",
      example: "Memoria_Calculo_Estructural_EdificioNuevaLuz.pdf",
      notes: [
        "Formato recomendado: PDF firmado digitalmente.",
        "Tamaño máximo: 50 MB por archivo.",
        "Puedes subir múltiples archivos si la memoria está dividida en tomos.",
      ],
    },
    "planos": {
      title: "Planos de Ingeniería",
      description: "Planos técnicos del proyecto según la especialidad: estructurales (cimentación, columnas, vigas, losas), sanitarios (isométricos, redes), eléctricos (unifilares, circuitos) u otros. Deben estar firmados y sellados por el profesional proyectista.",
      example: "Plano_Estructural_PB_EdificioNuevaLuz.pdf / .dwg",
      notes: [
        "Formatos aceptados: PDF, DWG, DXF.",
        "Incluye todos los planos relevantes del proyecto.",
        "Cada plano debe tener cuadro de rotulación completo.",
      ],
    },
    "planosArq": {
      title: "Planos Arquitectónicos",
      description: "Planos de arquitectura del proyecto: plantas de distribución, cortes, fachadas, detalles constructivos y cuadro de ambientes. Son necesarios para verificar la concordancia entre lo arquitectónico y lo estructural o de instalaciones.",
      example: "Plano_Arquitectonico_PB_EdificioNuevaLuz.pdf",
      notes: [
        "Formatos aceptados: PDF, DWG.",
        "Deben corresponder al proyecto aprobado o en trámite.",
        "Incluir planta de conjunto si aplica.",
      ],
    },
    "niveles": { title: "Número de Niveles", description: "La planta baja cuenta como nivel. Especificar sótanos y terrazas entre paréntesis.", example: "6 niveles (1 Terraza, 3 plantas y 2 sótanos)" },
    "coordenadas": { title: "Coordenadas (Lat. – Long.)", description: "Carga el mapa interactivo para seleccionar la ubicación exacta del predio. Se llenará automáticamente la latitud y longitud.", example: "-16.503487; -68.130420" },
    "municipio": { title: "Municipio", description: "Carga el mapa para detectar automáticamente el municipio o escríbelo.", example: "La Paz, El Alto, Viacha, Copacabana" },
    "zona": { title: "Zona", description: "Carga el mapa para detectar automáticamente la zona o barrio del predio.", notes: ['Si no es posible especificar, colocar "No Corresponde".'] },
    "calle": { title: "Calle", description: "Avenida, calle o pasaje y número del predio.", example: "Av. Arce N° 2631" },
    "interesado": { title: "Nombre del Interesado", description: "Nombre completo del propietario, representante legal o entidad solicitante." },
    "ingNombre": { title: "Nombre Ing. Proyectista", description: "Nombre completo del ingeniero que elabora y firma el proyecto." },
    "rni": { title: "RNI del Ingeniero", description: "Número de Registro Nacional de Ingeniero (RNI) vigente emitido por la SIB." },
    "altMuro": { title: "Altura Máxima Útil de Muro (m)", description: "Altura libre medida desde la base de cimentación hasta la coronación del muro de contención.", example: "3.50" },
    "luzPuente": { title: "Luz del Puente (m)", description: "Distancia libre entre apoyos del puente o viaducto, medida en metros.", example: "25.00" },
    "superfConstruir": { title: "Superficie a Construir (m²)", description: "Área total de construcción considerando todos los niveles (suma de plantas).", example: "1250.00" },
    "superfTablero": { title: "Superficie del Tablero a Construir (m²)", description: "Área del tablero del puente o viaducto, resultante de la luz por el ancho de calzada.", example: "125.00" },
    "superfReforzar": { title: "Superficie a Reforzar (m²)", description: "Área total de la estructura que será objeto de intervención de refuerzo.", example: "480.00" },
    "areaMuroCon": { title: "Área de Muro de Contención a Construir (m²)", description: "Área total de la cara expuesta del muro de contención nuevo a construir.", example: "85.00" },
    "areaMuroRef": { title: "Área de Muro de Contención a Reforzar (m²)", description: "Área total de la cara expuesta del muro de contención existente que será reforzado.", example: "60.00" },
    "areaMuroHA": { title: "Área de Muro de Hormigón Armado (m²)", description: "Área del muro de contención construido o a construir con hormigón armado (con acero de refuerzo).", example: "45.00" },
    "areaMuroHC": { title: "Área de Muro de Hormigón Ciclópeo (m²)", description: "Área del muro de contención construido o a construir con hormigón ciclópeo (con piedra grande embebida, sin acero).", example: "40.00" },
    "norma": { title: "Norma de Diseño", description: "Normativa técnica boliviana o internacional bajo la cual fue elaborado el proyecto.", example: "NB 1225001 (Diseño Sismorresistente), ACI 318, AASHTO LRFD" },
  };

  return FIELD_GUIDES[key] || null;
}

interface GeoResult {
  coordenadas: string;
  municipio: string;
  zona: string;
  calle: string;
}

// ── Props extendidas: recibe los estados de archivos desde Paso3Previa ──
interface FieldGuideProps {
  activeGuideKey: string | null;
  onFillFields?: (fields: any) => void;
  theme: any;
  isDark: boolean;
  cat?: Categoria | null;
  // Props para el panel de carga de archivos (paso 3)
  filesMemoria?: File[];
  setFilesMemoria?: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanos?: File[];
  setFilesPlanos?: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanosArq?: File[];
  setFilesPlanosArq?: React.Dispatch<React.SetStateAction<File[]>>;
  onClose?: () => void;
}

// ─── MAPA ────────────────────────────────────────────────────────────────────
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
      const icon = L.divIcon({ html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:${theme.accent};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);"></div>`, iconSize: [24, 24], iconAnchor: [12, 24], className: "" });
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
          setInfo({ coordenadas: `${lat.toFixed(6)}; ${lng.toFixed(6)}`, municipio: addr.city || addr.town || addr.municipality || addr.county || addr.state_district || "", zona: addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.hamlet || "", calle: addr.road ? `${addr.road} ${addr.house_number || ""}`.trim() : "" });
          setStatus("✅ Listo. (Clickea otro lugar si te equivocaste)");
        } catch { setStatus("❌ Error al obtener ubicación."); }
        finally { setLoading(false); isFetching.current = false; }
      });
      leafletRef.current = map;
    };
    if ((window as any).L) { initMap((window as any).L); }
    else {
      if (!document.getElementById("leaflet-css")) { const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link); }
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = () => initMap((window as any).L); document.head.appendChild(script);
    }
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; markerRef.current = null; } };
  }, [theme.accent]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: loading ? "#d97706" : theme.accent, padding: "8px 12px", background: theme.cardBg, borderRadius: 8, fontWeight: 600, border: `1px solid ${theme.border}` }}>{loading ? "⏳ " : ""}{status}</div>
      <div ref={mapRef} style={{ width: "100%", height: 220, borderRadius: 12, overflow: "hidden", border: `2px solid ${theme.border}`, zIndex: 1 }} />
      {info && (
        <div style={{ background: theme.boxBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "16px", fontSize: 12, animation: "fadeSlideUp 0.3s ease" }}>
          <div style={{ color: theme.accent, fontWeight: 800, marginBottom: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>📍 Datos detectados</div>
          {[{ label: "Coordenadas", val: info.coordenadas }, { label: "Municipio", val: info.municipio }, { label: "Zona", val: info.zona }, { label: "Calle", val: info.calle }].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: theme.textSec, fontWeight: 800, minWidth: 85 }}>{label}:</span>
              <span style={{ color: theme.textMain, fontWeight: 500 }}>{val || <em style={{ color: theme.textMuted }}>No detectado</em>}</span>
            </div>
          ))}
          <button onClick={() => { if (info) onSelect(info); }} style={{ marginTop: 12, width: "100%", background: theme.accent, color: isDark ? "#0a1a12" : "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
            ✅ Llenar formulario con estos datos
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PANEL DE CARGA DE ARCHIVOS ──────────────────────────────────────────────
function UploadPanel({
  uploadKey, guide, theme, isDark,
  filesMemoria, setFilesMemoria,
  filesPlanos, setFilesPlanos,
  filesPlanosArq, setFilesPlanosArq,
}: {
  uploadKey: UploadKey;
  guide: GuideContent;
  theme: any;
  isDark: boolean;
  filesMemoria: File[];
  setFilesMemoria: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanos: File[];
  setFilesPlanos: React.Dispatch<React.SetStateAction<File[]>>;
  filesPlanosArq: File[];
  setFilesPlanosArq: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = uploadKey === "memorias" ? filesMemoria : uploadKey === "planos" ? filesPlanos : filesPlanosArq;
  const setter = uploadKey === "memorias" ? setFilesMemoria : uploadKey === "planos" ? setFilesPlanos : setFilesPlanosArq;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setter(prev => [...prev, ...Array.from(incoming)]);
  };
  const removeFile = (i: number) => setter(prev => prev.filter((_, idx) => idx !== i));

  const icons: Record<UploadKey, string> = { memorias: "🧮", planos: "📐", planosArq: "🏛️" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Zona de drop ── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? theme.accent : theme.border}`,
          borderRadius: 16,
          background: dragOver
            ? (isDark ? "rgba(34,197,94,0.10)" : "rgba(16,185,129,0.07)")
            : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
          padding: "36px 20px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: dragOver ? `0 0 0 3px ${theme.accent}40` : "none",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>{dragOver ? "📂" : icons[uploadKey]}</div>
        <div style={{ fontSize: "0.9em", fontWeight: 700, color: theme.textMain, marginBottom: 6 }}>
          {dragOver ? "Suelta para agregar" : "Arrastra archivos aquí"}
        </div>
        <div style={{ fontSize: "0.78em", color: theme.textMuted, marginBottom: 16 }}>
          o haz clic para seleccionar desde tu equipo
        </div>
        <div style={{ display: "inline-block", background: theme.accent, color: isDark ? "#0a1a12" : "#fff", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: "0.82em", letterSpacing: 0.5 }}>
          + Seleccionar archivos
        </div>
        <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
      </div>

      {/* ── Botón Google Drive (placeholder) ── */}
      <button
        onClick={() => alert("Integración con Google Drive próximamente")}
        style={{ width: "100%", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 10, padding: "11px 16px", fontWeight: 700, fontSize: "0.82em", color: theme.textSec, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
        onMouseOver={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = theme.accent; }}
        onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = theme.border; }}
      >
        <svg width="16" height="16" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5L6.6 66.85z" fill="#0066da"/>
          <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9 9 0 000 53h27.5L43.65 25z" fill="#00ac47"/>
          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.1L73.55 76.8z" fill="#ea4335"/>
          <path d="M43.65 25L57.4 1.2A9.06 9.06 0 0053.3.05H34C31.5.05 29.2 1.3 27.9 3.35L43.65 25z" fill="#00832d"/>
          <path d="M60.1 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L60.1 53z" fill="#2684fc"/>
          <path d="M73.4 26.5L60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.45 28h27.45c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z" fill="#ffba00"/>
        </svg>
        Subir desde Google Drive
      </button>

      {/* ── Lista de archivos cargados ── */}
      {files.length > 0 && (
        <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${theme.border}`, fontSize: "0.78em", color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
            📁 {files.length} archivo{files.length > 1 ? "s" : ""} agregado{files.length > 1 ? "s" : ""}
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto", padding: "8px 10px" }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", marginBottom: 4, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 8, fontSize: "0.78em" }}>
                <span style={{ color: theme.textMain, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>📄 {f.name}</span>
                <span style={{ color: theme.textMuted, fontSize: "0.9em", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                  <button
                    onClick={() => removeFile(i)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 800, fontSize: "1.1em", padding: "0 2px", lineHeight: 1 }}
                  >✕</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Descripción + Ejemplo + Notas ── */}
      <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>📌 Descripción</div>
        <p style={{ fontSize: 13, color: theme.textMain, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{guide.description}</p>
      </div>

      {guide.example && (
        <div style={{ background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", border: `1px solid ${theme.border}`, borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>✅ Ejemplo</div>
          <pre style={{ fontSize: 12, color: isDark ? "#86efac" : "#166534", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.7, fontWeight: 600 }}>{guide.example}</pre>
        </div>
      )}

      {guide.notes && guide.notes.length > 0 && (
        <div style={{ background: isDark ? "rgba(245,158,11,0.1)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "#fcd34d"}`, borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 11, color: "#d97706", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>⚠️ Notas de Normativa</div>
          {guide.notes.map((note, i) => (
            <p key={i} style={{ fontSize: 12, color: isDark ? "#fcd34d" : "#92400e", margin: "0 0 6px 0", lineHeight: 1.6, fontWeight: 500 }}>• {note}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
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

  // Logo: solo se muestra si NO es una clave de upload (paso 3)
  const mainCatKey: string | null = isUploadKey ? null :
    guide?.mainCatKey ??
    (cat?.disciplina ? Object.keys(ESTRUCTURA_CATEGORIAS).find(catKey =>
      ESTRUCTURA_CATEGORIAS[catKey]?.includes(cat.disciplina as any)
    ) ?? null : null);

  const logoData = mainCatKey ? CATEGORY_LOGOS[mainCatKey] : null;
  const logoSrc = logoData ? (isDark ? logoData.dark : logoData.light) : null;

  return (
    <div style={{ width: "100%", height: "100%", background: theme.boxBg, borderLeft: "var(--guide-border)", display: "flex", flexDirection: "column", overflowY: "hidden", transition: "all 0.3s ease" }}>
      <style>{`
        :root {
          --guide-border: 1px solid ${theme.border};
        }
        @media (max-width: 1024px) {
          :root {
            --guide-border: none;
          }
        }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes logoFadeIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .gt { width:100%; border-collapse:collapse; margin-top: 8px; }
        .gt th { background: ${theme.cardBg}; color: ${theme.textSec}; padding:10px; text-align:left; border:1px solid ${theme.border}; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight: 800; }
        .gt td { color: ${theme.textMain}; padding:8px 10px; border:1px solid ${theme.border}; vertical-align:top; line-height:1.5; font-size:12px; font-weight: 500; }
        .gt tr:nth-child(even) td { background: rgba(0,0,0,0.02); }
        .gs { overflow-y:auto; flex:1; padding: 24px; }
        .gs::-webkit-scrollbar { width:6px; }
        .gs::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius:4px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, background: theme.headerGrad, backdropFilter: "blur(10px)", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: theme.accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontWeight: 800 }}>
          {isUploadKey ? "📎 Carga de Documentos" : isMapField ? "🗺️ Ubicación Espacial" : "💡 Asistente S.I.B."}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 18, color: theme.textMain, fontWeight: 800, lineHeight: 1.3 }}>
            {guide?.title || activeGuideKey || "Panel de Ayuda"}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              style={{ background: "transparent", border: "none", color: theme.textMuted, fontSize: 24, cursor: "pointer", padding: "0 4px" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="gs">
        {/* Estado inicial vacío */}
        {!guide && !isMapField && !isUploadKey ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.6 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>👈</div>
            <div style={{ color: theme.textMain, fontSize: 16, textAlign: "center", fontWeight: 600, padding: "0 20px" }}>
              Pasa el cursor sobre un campo para ver su definición técnica aquí.
            </div>
          </div>
        ) : (
          <>
            {/* ── Panel de carga de archivos (solo para uploadKeys) ── */}
            {isUploadKey && guide && setFilesMemoria && setFilesPlanos && setFilesPlanosArq ? (
              <UploadPanel
                uploadKey={activeGuideKey as UploadKey}
                guide={guide}
                theme={theme}
                isDark={isDark}
                filesMemoria={filesMemoria}
                setFilesMemoria={setFilesMemoria}
                filesPlanos={filesPlanos}
                setFilesPlanos={setFilesPlanos}
                filesPlanosArq={filesPlanosArq}
                setFilesPlanosArq={setFilesPlanosArq}
              />
            ) : (
              <>
                {/* ── Logo de especialidad (solo nivel 1, no en paso 3) ── */}
                {logoSrc && !isUploadKey && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, animation: "logoFadeIn 0.4s ease" }}>
                    <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "20px 24px", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: theme.glow }}>
                      <img src={logoSrc} alt={`Logo ${mainCatKey}`} style={{ maxHeight: 80, maxWidth: 160, objectFit: "contain", display: "block" }} />
                    </div>
                  </div>
                )}

                {/* ── Mapa ── */}
                {isMapField && (
                  <div style={{ marginBottom: 24 }}>
                    {!showMap ? (
                      <div style={{ background: theme.cardBg, border: `1px dashed ${theme.border}`, borderRadius: 14, padding: "30px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                        <p style={{ color: theme.textSec, fontSize: 13, marginBottom: 20, fontWeight: 500 }}>El mapa autocompletará Municipio, Zona y Coordenadas.</p>
                        <button onClick={() => setShowMap(true)} style={{ background: theme.accent, color: isDark ? "#0a1a12" : "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer", transition: "all 0.2s", boxShadow: `0 4px 14px ${theme.border}` }}>
                          🗺️ Cargar Mapa Interactivo
                        </button>
                      </div>
                    ) : (
                      <MapSelector onSelect={handleMapSelect} theme={theme} isDark={isDark} />
                    )}
                  </div>
                )}

                {/* ── Descripción ── */}
                {guide && (
                  <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "20px", marginBottom: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>📌 Descripción</div>
                    <p style={{ fontSize: 14, color: theme.textMain, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{guide.description}</p>
                  </div>
                )}

                {/* ── Ejemplo ── */}
                {guide?.example && (
                  <div style={{ background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4", border: `1px solid ${theme.border}`, borderRadius: 14, padding: "20px", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: theme.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>✅ Ejemplo Práctico</div>
                    <pre style={{ fontSize: 13, color: isDark ? "#86efac" : "#166534", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.7, fontWeight: 600 }}>{guide.example}</pre>
                  </div>
                )}

                {/* ── Tabla ── */}
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

                {/* ── Notas ── */}
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