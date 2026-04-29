"use client";

import { useState, useEffect } from "react";
import { generarCaratulaPDF } from "./generarPDF";
import FieldGuide from "./FieldGuide";
import { useQRCode } from "./hooks/useQRCode";
import { generateDocumentSHA256, createDocumentMetadata, DocumentMetadata } from "./data/documentHelper";

// 1. DATA Y TIPOS
import { 
  THEMES, CATEGORIAS, QR_ORDER,
  Disciplina, FieldKey, FormData, Categoria 
} from "./data/diccionarios";

// 2. COMPONENTES DE UI
import Cabecera from "./components/Cabecera";
import ModalAjustes from "./components/ModalAjustes";
import Paso1Categoria from "./components/Paso1Categoria";
import Paso2Formulario from "./components/Paso2Formulario";
import Paso3Previa from "./components/Paso3Previa";
import Paso4Descarga from "./components/Paso4Descarga";

export default function Caratulas() {
  // --- ESTADOS DE APARIENCIA ---
  const [themeMode, setThemeMode] = useState<keyof typeof THEMES>("light"); 
  const [appFont, setAppFont] = useState("'Inter', sans-serif");
  const [appFontSize, setAppFontSize] = useState("14px");
  const [showSettings, setShowSettings] = useState(false);

  // --- ESTADOS DEL FORMULARIO ---
  const [step, setStep] = useState(1);
  const [mainCat, setMainCat] = useState<string>("");
  const [subCat, setSubCat] = useState<Disciplina | "">("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [documentSHA256, setDocumentSHA256] = useState<string>("");
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);

  const handleInteresadosChange = (list: string[]) => {
    setFormData(prev => ({ ...prev, interesados: list }));
  };

  // --- ESTADOS DE ARCHIVOS COMPLEMENTARIOS (compartidos entre Paso3 y FieldGuide) ---
  const [filesMemoria,   setFilesMemoria]   = useState<File[]>([]);
  const [filesPlanos,    setFilesPlanos]    = useState<File[]>([]);
  const [filesPlanosArq, setFilesPlanosArq] = useState<File[]>([]);

  const cat = selectedCat !== null ? CATEGORIAS[selectedCat] : null;
  const C = THEMES[themeMode]; 

  // --- EFECTOS DE GUARDADO (LOCAL STORAGE) ---
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemeMode(prefersDark ? "dark" : "light");
    
    const savedFont = sessionStorage.getItem('sib_font');
    const savedSize = sessionStorage.getItem('sib_size');
    const savedTheme = sessionStorage.getItem('sib_theme') as keyof typeof THEMES;
    if(savedFont) setAppFont(savedFont);
    if(savedSize) setAppFontSize(savedSize);
    if(savedTheme && THEMES[savedTheme]) setThemeMode(savedTheme);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('sib_theme', themeMode);
    sessionStorage.setItem('sib_font', appFont);
    sessionStorage.setItem('sib_size', appFontSize);
  }, [themeMode, appFont, appFontSize]);

  // --- FUNCIONES CONTROLADORAS ---
  function goToStep2() {
    if (selectedCat === null) { alert("Selecciona un proyecto primero."); return; }
    setStep(2);
    setActiveGuideKey(null);
  }

  function goToStep3() {
    if (!cat) return;
    setStep(3);
  }

  useEffect(() => {
    if (!cat) {
      setDocumentSHA256("");
      setDocumentMetadata(null);
      return;
    }

    let isActive = true;
    const timestamp = new Date().toISOString();

    const run = async () => {
      try {
        const sha256 = await generateDocumentSHA256(formData, cat, timestamp);
        if (!isActive) return;
        setDocumentSHA256(sha256);
        setDocumentMetadata(createDocumentMetadata(sha256, formData, cat, timestamp));
      } catch {
        if (!isActive) return;
        setDocumentSHA256("");
        setDocumentMetadata(null);
      }
    };

    run();
    return () => { isActive = false; };
  }, [formData, cat]);

  const { qrDataUrl: documentQRUrl } = useQRCode(
    documentMetadata ? JSON.stringify(documentMetadata) : JSON.stringify({ test: "GENERANDO QR..." }),
    {
      width: 300,
      margin: 2,
      dark: "#0f2419",
      light: "#ffffff",
      errorCorrectionLevel: "L",
    }
  );

  async function downloadPDF(format: "letter" | "a4" = "letter") {
    if (!cat) return;
    await generarCaratulaPDF(formData, cat, documentQRUrl, format, documentSHA256, mainCat);
  }

  function resetForm() {
    setStep(1); 
    setSelectedCat(null); 
    setMainCat(""); 
    setSubCat(""); 
    setFormData({}); 
    setActiveGuideKey(null);
    // Limpiar archivos complementarios
    setFilesMemoria([]);
    setFilesPlanos([]);
    setFilesPlanosArq([]);
  }

  const handleInputChange = (key: FieldKey, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const stepLabels = ["Categoría", "Datos", "Vista Previa", "Descargar"];

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;500;700&display=swap');
      html, body {
        margin: 0; padding: 0; min-height: 100vh;
        background: ${C.bgGrad}; background-attachment: fixed; transition: background 0.3s ease;
        font-family: ${appFont};
        font-size: ${appFontSize};
      }
      * { box-sizing: border-box; }
    `}</style>
    
    <ModalAjustes 
        show={showSettings} onClose={() => setShowSettings(false)} C={C} 
        themeMode={themeMode} setThemeMode={setThemeMode} 
        appFont={appFont} setAppFont={setAppFont} 
        appFontSize={appFontSize} setAppFontSize={setAppFontSize} 
    />

    <div style={{ minHeight:"100vh", color: C.textMain, transition: "all 0.3s ease" }}>
      
      <Cabecera themeMode={themeMode} C={C} onOpenSettings={() => setShowSettings(true)} />

      <div style={{ display: "flex", width: "100%", maxWidth: 1600, margin: "0 auto" }}>
        
        {/* LADO IZQUIERDO: 70% (Formulario) */}
        <div style={{ flex: "0 0 70%", padding: "40px" }}>

          {/* TABS DE PROGRESO */}
          <div style={{ display: "flex", marginBottom: 40, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: C.cardBg, boxShadow: C.glow }}>
            {stepLabels.map((label, i) => {
              const n = i+1, isActive = step===n, isDone = step>n;
              return (
                <div key={n} style={{ flex: 1, padding: "18px 8px", textAlign: "center", fontSize: "0.85em", textTransform: "uppercase", letterSpacing: 1, background: isActive ? C.accent : isDone ? C.accentLight : "transparent", color: isActive ? (themeMode === "light" ? "#fff" : C.deepGreen) : isDone ? C.accent : C.textMuted, fontWeight: isActive ? 800 : 600, borderRight: i<3 ? `1px solid ${C.border}` : "none", transition: "all 0.3s" }}>
                  <div style={{ fontSize: "1.8em", fontWeight: 900, marginBottom: 4 }}>{n}</div>{label}
                </div>
              );
            })}
          </div>

          {/* RENDERIZADO DINÁMICO DE PASOS */}
          
          {step === 1 && (
            <Paso1Categoria 
              C={C} themeMode={themeMode}
              mainCat={mainCat} setMainCat={setMainCat}
              subCat={subCat} setSubCat={setSubCat}
              selectedCat={selectedCat} setSelectedCat={setSelectedCat}
              setActiveGuideKey={setActiveGuideKey}
              goToStep2={goToStep2}
            />
          )}

          {step === 2 && cat && (
            <Paso2Formulario 
              C={C} themeMode={themeMode}
              cat={cat} formData={formData}
              handleInputChange={handleInputChange}
              handleInteresadosChange={handleInteresadosChange}
              setActiveGuideKey={setActiveGuideKey}
              goBack={() => { setStep(1); setActiveGuideKey(null); }}
              goToStep3={goToStep3}
            />
          )}

          {step === 3 && cat && (
            <Paso3Previa 
              C={C} themeMode={themeMode}
              cat={cat} formData={formData}
              documentQRUrl={documentQRUrl}
              documentSHA256={documentSHA256}
              mainCat={mainCat}
              goBack={() => setStep(2)}
              goToStep4={() => setStep(4)}
              activeGuideKey={activeGuideKey}
              setActiveGuideKey={setActiveGuideKey}
              filesMemoria={filesMemoria}     setFilesMemoria={setFilesMemoria}
              filesPlanos={filesPlanos}       setFilesPlanos={setFilesPlanos}
              filesPlanosArq={filesPlanosArq} setFilesPlanosArq={setFilesPlanosArq}
            />
          )}

          {step === 4 && cat && (
            <Paso4Descarga 
              C={C} themeMode={themeMode}
              cat={cat} formData={formData}
              downloadPDF={downloadPDF}
              resetForm={resetForm}
            />
          )}

        </div>

        {/* LADO DERECHO: 30% (Guía) */}
        <div style={{ flex: "0 0 30%", position: "sticky", top: 76, height: "calc(100vh - 76px)" }}>
          <FieldGuide 
            activeGuideKey={activeGuideKey} 
            onFillFields={(fields) => setFormData(prev => ({ ...prev, ...fields }))}
            theme={C}
            isDark={themeMode !== "light"}
            cat={cat}
            filesMemoria={filesMemoria}     setFilesMemoria={setFilesMemoria}
            filesPlanos={filesPlanos}       setFilesPlanos={setFilesPlanos}
            filesPlanosArq={filesPlanosArq} setFilesPlanosArq={setFilesPlanosArq}
          />
        </div>
      </div>
    </div>
    </>
  );
}