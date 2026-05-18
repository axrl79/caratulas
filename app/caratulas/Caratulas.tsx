"use client";

import { useState, useEffect } from "react";
import { generarCaratulaPDF } from "./generarPDF";
import FieldGuide from "./FieldGuide";
import { useQRCode } from "./hooks/useQRCode";
import { generateDocumentSHA256, createDocumentMetadata, DocumentMetadata } from "./data/documentHelper";

import { 
  THEMES, CATEGORIAS, QR_ORDER,
  Disciplina, FieldKey, FormData, Categoria 
} from "./data/diccionarios";

import Cabecera from "./components/Cabecera";
import ModalAjustes from "./components/ModalAjustes";
import Paso1Categoria from "./components/Paso1Categoria";
import Paso2Formulario from "./components/Paso2Formulario";
import Paso3Previa from "./components/Paso3Previa";
import Paso4Envio from "./components/Paso4Envio";
import Paso5Descarga from "./components/Paso5Descarga";

export default function Caratulas() {
  const [themeMode, setThemeMode] = useState<keyof typeof THEMES>("light"); 
  const [appFont, setAppFont] = useState("'Inter', sans-serif");
  const [appFontSize, setAppFontSize] = useState("14px");
  const [showSettings, setShowSettings] = useState(false);

  const [step, setStep] = useState(1);
  const [mainCat, setMainCat] = useState<string>("");
  const [subCat, setSubCat] = useState<Disciplina | "">("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [documentSHA256, setDocumentSHA256] = useState<string>("");
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [hasNewInfo, setHasNewInfo] = useState(false);

  useEffect(() => {
    if (isMobile && activeGuideKey && !showMobileGuide) {
      setHasNewInfo(true);
    }
  }, [activeGuideKey, isMobile, showMobileGuide]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleInteresadosChange = (list: string[]) => {
    setFormData(prev => ({ ...prev, interesados: list }));
  };

  const [filesMemoria,   setFilesMemoria]   = useState<File[]>([]);
  const [filesPlanos,    setFilesPlanos]    = useState<File[]>([]);
  const [filesPlanosArq, setFilesPlanosArq] = useState<File[]>([]);

  const cat = selectedCat !== null ? CATEGORIAS[selectedCat] : null;
  const C = THEMES[themeMode]; 

  useEffect(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setThemeMode(prefersDark ? "dark" : "light");
  const savedFont = sessionStorage.getItem('sib_font');
  const savedSize = sessionStorage.getItem('sib_size');
  const savedTheme = sessionStorage.getItem('sib_theme') as keyof typeof THEMES;
  if(savedFont) setAppFont(savedFont);
  if(savedSize) setAppFontSize(savedSize);
  if(savedTheme && THEMES[savedTheme]) setThemeMode(savedTheme);

  // ── Recuperar progreso ──
  try {
    const savedStep = localStorage.getItem('sib_step');
    const savedCat = localStorage.getItem('sib_selectedCat');
    const savedMain = localStorage.getItem('sib_mainCat');
    const savedSub = localStorage.getItem('sib_subCat');
    const savedForm = localStorage.getItem('sib_formData');

    if (savedCat !== null) setSelectedCat(Number(savedCat));
    if (savedMain) setMainCat(savedMain);
    if (savedSub) setSubCat(savedSub as Disciplina);
    if (savedForm) setFormData(JSON.parse(savedForm));
    if (savedStep) setStep(Number(savedStep));
  } catch {
    // si algo falla simplemente empieza desde cero
  }
}, []);

  useEffect(() => {
    sessionStorage.setItem('sib_theme', themeMode);
    sessionStorage.setItem('sib_font', appFont);
    sessionStorage.setItem('sib_size', appFontSize);
  }, [themeMode, appFont, appFontSize]);

  useEffect(() => {
  if (selectedCat === null) return; // no guardar si no hay selección
  localStorage.setItem('sib_step', String(step));
  localStorage.setItem('sib_selectedCat', String(selectedCat));
  localStorage.setItem('sib_mainCat', mainCat);
  localStorage.setItem('sib_subCat', subCat);
  localStorage.setItem('sib_formData', JSON.stringify(formData));
}, [step, selectedCat, mainCat, subCat, formData]);


  function goToStep2() {
  if (selectedCat === null) { setAlertMsg("Selecciona un proyecto primero."); return; }
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
    { width: 300, margin: 2, dark: "#0f2419", light: "#ffffff", errorCorrectionLevel: "L" }
  );

  async function downloadPDF(format: "letter" | "a4" = "letter") {
  if (!cat) return;
  await generarCaratulaPDF(formData, cat, documentQRUrl, format, documentSHA256, mainCat);
}

  async function generatePDFBlob(format: "letter" | "a4" = "letter"): Promise<Blob> {
  if (!cat) throw new Error("Categoría no seleccionada");
  const { generarCaratulaPDFBlob } = await import("./generarPDF");
  return await generarCaratulaPDFBlob(
    formData, cat, documentQRUrl, format, documentSHA256, mainCat
  );
}
// Upload logic is now inside Paso4Envio.tsx
// PDF generation is kept in hooks or called by the step directly.


  function resetForm() {
  setStep(1); 
  setSelectedCat(null); 
  setMainCat(""); 
  setSubCat(""); 
  setFormData({}); 
  setActiveGuideKey(null);
  setFilesMemoria([]);
  setFilesPlanos([]);
  setFilesPlanosArq([]);
  // ── Limpiar progreso guardado ──
  localStorage.removeItem('sib_step');
  localStorage.removeItem('sib_selectedCat');
  localStorage.removeItem('sib_mainCat');
  localStorage.removeItem('sib_subCat');
  localStorage.removeItem('sib_formData');
}

  const handleInputChange = (key: FieldKey, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const stepLabels = ["Categoría", "Datos", "Vista Previa", "Envío", "Descargar"];
function canNavigateTo(targetStep: number): boolean {
  if (targetStep === step) return false;
  if (selectedCat === null) return false;
  return true;
}

function handleStepClick(targetStep: number) {
  if (!canNavigateTo(targetStep)) return;
  setStep(targetStep);
  setActiveGuideKey(null);
}
  // ── Altura del header (debe coincidir con Cabecera) ──
  const HEADER_H = 76;

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;500;700&display=swap');
      html, body {
        margin: 0; padding: 0; min-height: 100%;
        overflow: hidden; 
        background: ${C.bgGrad}; background-attachment: fixed; transition: background 0.3s ease;
        font-family: ${appFont};
        font-size: ${appFontSize};
      }
      * { box-sizing: border-box; }

      /* ── Layout principal ── */
      .sib-layout {
  display: flex;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  height: calc(100vh - ${HEADER_H}px);   /* altura fija, no min-height */
  align-items: flex-start;
  overflow: hidden;   
      }

      /* ── Columna izquierda: 60% ── */
      .sib-content {
        flex: 0 0 60%;
  padding: 40px;
  min-width: 0;
  height: 100%;          /* ocupa toda la altura del layout */
  overflow-y: auto;
      }

      /* ── Columna derecha: 40% — sticky que sigue el scroll ── */
      .sib-guide {
        flex: 0 0 40%;
        position: sticky;
        top: ${HEADER_H}px;
        height: calc(100vh - ${HEADER_H}px);
        overflow: hidden;
        border-left: 1px solid ${C.border};
        display: flex;
        flex-direction: column;
        z-index: 10;
      }

      /* ── Móvil ── */
      @media (max-width: 1023px) {
        .sib-content { flex: 1 1 auto; padding: 20px; }
        .sib-guide   { display: none; }
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse-accent {
        0%   { box-shadow: 0 0 0 0   ${C.accent}80; }
        70%  { box-shadow: 0 0 0 20px ${C.accent}00; }
        100% { box-shadow: 0 0 0 0   ${C.accent}00; }
      }
    `}</style>
    
    <ModalAjustes 
      show={showSettings} onClose={() => setShowSettings(false)} C={C} 
      themeMode={themeMode} setThemeMode={setThemeMode} 
      appFont={appFont} setAppFont={setAppFont} 
      appFontSize={appFontSize} setAppFontSize={setAppFontSize} 
    />

<div style={{ height: "100vh", color: C.textMain, transition: "all 0.3s ease", display: "flex", flexDirection: "column", overflow: "hidden" }}>      
      <Cabecera themeMode={themeMode} C={C} onOpenSettings={() => setShowSettings(true)} />

      <div className="sib-layout">
        
        {/* ── COLUMNA IZQUIERDA: 60% ── */}
        <div className="sib-content">

          {/* Tabs de progreso */}
          <div style={{ 
            display: "flex", marginBottom: isMobile ? 24 : 40, 
            borderRadius: 14, overflow: "hidden", 
            border: `1px solid ${C.border}`, background: C.cardBg, boxShadow: C.glow,
            flexWrap: isMobile ? "wrap" : "nowrap"
          }}>
           {stepLabels.map((label, i) => {
  const n = i+1, isActive = step===n, isDone = step>n;
  const isClickable = canNavigateTo(n);
  return (
    <div
      key={n}
      onClick={() => handleStepClick(n)}
      style={{ 
        flex: isMobile ? "1 0 50%" : 1, 
        padding: isMobile ? "12px 6px" : "18px 8px", 
        textAlign: "center", 
        fontSize: isMobile ? "0.75em" : "0.85em", 
        textTransform: "uppercase", letterSpacing: 1, 
        background: isActive ? C.accent : isDone ? C.accentLight : "transparent", 
        color: isActive ? (themeMode === "light" ? "#fff" : C.deepGreen) : isDone ? C.accent : C.textMuted, 
        fontWeight: isActive ? 800 : 600, 
        borderRight: (!isMobile && i < 4) ? `1px solid ${C.border}` : "none",
        borderBottom: (isMobile && i < 3) ? `1px solid ${C.border}` : "none",
        transition: "all 0.3s",
        cursor: isClickable ? "pointer" : isActive ? "default" : "not-allowed",
        opacity: !isActive && !isDone && selectedCat === null ? 0.4 : 1,
      }}
    >
      <div style={{ fontSize: isMobile ? "1.4em" : "1.8em", fontWeight: 900, marginBottom: 2 }}>{n}</div>
      {label}
    </div>
  );
})}
          </div>

          {/* FAB móvil */}
          {isMobile && (
            <>
              <button 
                onClick={() => { setShowMobileGuide(true); setHasNewInfo(false); }}
                style={{
                  position: "fixed", bottom: 24, right: 24,
                  width: 64, height: 64, borderRadius: "50%",
                  background: C.accent, border: "none",
                  color: themeMode === "light" ? "#fff" : C.deepGreen,
                  fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 8px 32px ${C.accent}60`, zIndex: 1000,
                  cursor: "pointer", transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  animation: hasNewInfo ? "pulse-accent 2s infinite" : "none"
                }}
              >
                <span style={{ transform: "translateY(-1px)" }}>💡</span>
                {hasNewInfo && (
                  <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, background: "#ef4444", borderRadius: "50%", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />
                )}
              </button>
              <div style={{ 
                position: "fixed", bottom: 94, right: 28, 
                background: "rgba(0,0,0,0.8)", color: "#fff", 
                padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                opacity: hasNewInfo ? 1 : 0, transform: hasNewInfo ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.3s", pointerEvents: "none", zIndex: 1000,
              }}>
                ¡Tengo información para ti!
              </div>
            </>
          )}

          {/* Pasos */}
          <div style={{ animation: "fadeIn 0.4s ease" }}>
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
                onEnviarABD={async () => {}} // Deprecated function, but keeping prop if child uses it

              />
            )}
            {step === 4 && cat && (
              <Paso4Envio 
                C={C} themeMode={themeMode}
                cat={cat} formData={formData}
                documentSHA256={documentSHA256}
                mainCat={mainCat}
                filesMemoria={filesMemoria}
                filesPlanos={filesPlanos}
                filesPlanosArq={filesPlanosArq}
                generatePDFBlob={generatePDFBlob}
                goBack={() => setStep(3)}
                onSuccess={(registroId, codHash) => {
                  setDocumentSHA256(codHash);
                  setStep(5);
                }}
              />
            )}
            {step === 5 && cat && (
              <Paso5Descarga 
                C={C} themeMode={themeMode}
                documentSHA256={documentSHA256}
                cat={cat}
                formData={formData}
                downloadPDF={downloadPDF}
                resetForm={resetForm}
              />
            )}
          </div>
        </div>

        {/* ── COLUMNA DERECHA: 40% sticky ── */}
        <div className="sib-guide">
          <FieldGuide 
  activeGuideKey={activeGuideKey} 
  onFillFields={(fields) => setFormData(prev => ({ ...prev, ...fields }))}
  theme={C}
  isDark={themeMode !== "light"}
  cat={cat}
  currentStep={step}
  filesMemoria={filesMemoria}     setFilesMemoria={setFilesMemoria}
  filesPlanos={filesPlanos}       setFilesPlanos={setFilesPlanos}
  filesPlanosArq={filesPlanosArq} setFilesPlanosArq={setFilesPlanosArq}
/>
        </div>
      </div>

      {/* Drawer móvil */}
      {isMobile && (
        <div style={{ 
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          zIndex: 9999,
          visibility: showMobileGuide ? "visible" : "hidden",
          opacity: showMobileGuide ? 1 : 0,
          transition: "all 0.3s ease",
          display: "flex", alignItems: "flex-end"
        }} onClick={() => setShowMobileGuide(false)}>
          <div style={{ 
            width: "100%", height: "85vh", 
            background: C.bgGrad, 
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            overflow: "hidden",
            transform: showMobileGuide ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.3)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "12px auto", opacity: 0.5 }} />
            <FieldGuide 
  activeGuideKey={activeGuideKey} 
  onFillFields={(fields) => setFormData(prev => ({ ...prev, ...fields }))}
  theme={C}
  isDark={themeMode !== "light"}
  cat={cat}
  currentStep={step}
  filesMemoria={filesMemoria}     setFilesMemoria={setFilesMemoria}
  filesPlanos={filesPlanos}       setFilesPlanos={setFilesPlanos}
  filesPlanosArq={filesPlanosArq} setFilesPlanosArq={setFilesPlanosArq}
/>
          </div>
        </div>
      )}
    </div>
    {/* ── Modal de alerta ── */}
{alertMsg && (
  <div
    onClick={() => setAlertMsg(null)}
    style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: C.cardBg, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "40px 48px",
        boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px ${C.accent}30`,
        maxWidth: 400, width: "90%", textAlign: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{
        fontSize: "1.1em", color: C.textMain, fontWeight: 700,
        lineHeight: 1.5, marginBottom: 28,
      }}>
        {alertMsg}
      </div>
      <button
        onClick={() => setAlertMsg(null)}
        style={{
          background: C.accent,
          color: themeMode === "light" ? "#fff" : C.deepGreen,
          border: "none", borderRadius: 10,
          padding: "12px 36px", fontWeight: 800,
          fontSize: "1em", cursor: "pointer",
          boxShadow: `0 4px 14px ${C.accent}60`,
        }}
      >
        Entendido
      </button>
    </div>
  </div>
)}
    </>
  );
}