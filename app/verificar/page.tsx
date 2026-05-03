"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

// ─────────────────────────────────────────────────────────────────────────
// TEMAS Y ESTILOS DINÁMICOS
// ─────────────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    name: "Oscuro", bgGrad: "linear-gradient(160deg, #0f2419 0%, #1a3a2a 50%, #0a1a12 100%)",
    headerGrad: "linear-gradient(90deg, rgba(15,36,25,0.95), rgba(26,58,42,0.95))",
    cardBg: "rgba(255,255,255,0.03)", textMain: "#ffffff", textSec: "#a8d5b5", textMuted: "#8ca896",
    accent: "#4e9e6a", accentHover: "#3a7a52", accentLight: "rgba(78, 158, 106, 0.15)",
    border: "rgba(74,158,106,0.35)", glow: "0 8px 32px rgba(0,0,0,0.4)",
    inputBg: "rgba(0,0,0,0.2)", boxBg: "rgba(0,0,0,0.4)", logoShadow: "drop-shadow(0 10px 15px rgba(78, 158, 106, 0.3))"
  },
  light: {
    name: "Claro", bgGrad: "linear-gradient(160deg, #f4faf6 0%, #e8f4ec 50%, #dcfce7 100%)",
    headerGrad: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(240,253,244,0.95))",
    cardBg: "rgba(255,255,255,0.8)", textMain: "#0f2419", textSec: "#2d5a3d", textMuted: "#5b7a66",
    accent: "#16a34a", accentHover: "#15803d", accentLight: "rgba(22, 163, 74, 0.15)",
    border: "rgba(22,163,74,0.25)", glow: "0 8px 30px rgba(0,0,0,0.06)",
    inputBg: "#ffffff", boxBg: "#f0fdf4", logoShadow: "drop-shadow(0 10px 15px rgba(22, 163, 74, 0.2))"
  },
  engineering: {
    name: "Verde SIB", bgGrad: "linear-gradient(160deg, #051f11 0%, #0a3821 50%, #020d07 100%)",
    headerGrad: "linear-gradient(90deg, rgba(5,31,17,0.95), rgba(10,56,33,0.95))",
    cardBg: "rgba(34, 197, 94, 0.04)", textMain: "#ffffff", textSec: "#4ade80", textMuted: "#86efac",
    accent: "#22c55e", accentHover: "#16a34a", accentLight: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.4)", glow: "0 12px 40px rgba(34, 197, 94, 0.2)",
    inputBg: "rgba(0,0,0,0.4)", boxBg: "rgba(0,0,0,0.6)", logoShadow: "drop-shadow(0 12px 20px rgba(34, 197, 94, 0.4))"
  }
};

export default function VerificarPage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'file' | null>(null);
  const html5QrCode = useRef<Html5Qrcode | null>(null);
  
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('engineering');

  useEffect(() => {
    const savedTheme = localStorage.getItem("sib-theme") as keyof typeof THEMES;
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme);
  }, []);

  const handleThemeChange = (themeKey: keyof typeof THEMES) => {
    setActiveTheme(themeKey);
    localStorage.setItem("sib-theme", themeKey);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LÓGICA INTELIGENTE DEL ESCÁNER (CÁMARA Y ARCHIVOS)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (showScanner && scanMode === 'camera') {
      timeoutId = setTimeout(() => {
        const readerElement = document.getElementById("reader");
        if (readerElement) {
          try {
            html5QrCode.current = new Html5Qrcode("reader");
            
            // Detección inteligente de cámaras (soluciona el problema de laptops)
            Html5Qrcode.getCameras().then(devices => {
              if (devices && devices.length > 0) {
                // Buscamos cámara trasera primero, si no, usamos la que haya (laptop)
                let cameraId = devices[0].id;
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'));
                if (backCamera) cameraId = backCamera.id;

                if (!html5QrCode.current?.isScanning) {
                  html5QrCode.current?.start(
                    cameraId,
                    { fps: 15, qrbox: { width: 280, height: 280 } },
                    handleScanSuccess,
                    () => { /* ignorar errores de lectura continua */ }
                  ).catch(err => {
                    setError("❌ Error al encender cámara. Verifica los permisos del navegador.");
                  });
                }
              }
            }).catch(err => {
              setError("❌ No se detectaron cámaras en el dispositivo.");
            });

          } catch (e) {
            console.error("Error inicializando Html5Qrcode", e);
          }
        }
      }, 200);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showScanner, scanMode]);

  const stopCamera = async () => {
    if (html5QrCode.current) {
      try {
        if (html5QrCode.current.isScanning) {
          await html5QrCode.current.stop();
        }
        html5QrCode.current.clear();
      } catch (err) {
        // Ignorar
      }
      html5QrCode.current = null;
    }
  };

  // EXTRACTOR DEL ID SHA-256 DESDE EL JSON DEL QR
  const handleScanSuccess = (decodedText: string) => {
    try {
      // Limpiamos el texto por si vienen espacios en blanco
      const cleanText = decodedText.trim();
      const parsedData = JSON.parse(cleanText);
      
      // Si el QR tiene la estructura {"id": "f103...", "code": "PRE5", ...}
      if (parsedData && parsedData.id) {
        setSearchId(parsedData.id); // Extrae SOLAMENTE el SHA-256
      } else {
        setSearchId(cleanText);
      }
    } catch (e) {
      // Si no es un JSON, asume que el texto es el ID directo
      setSearchId(decodedText.trim());
    }
    
    closeScanner();
    setError(""); 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Usamos el contenedor oculto pero que SI existe físicamente (visibility: hidden)
      const html5QrCodeFile = new Html5Qrcode("reader-file-dummy");
      try {
        const decodedText = await html5QrCodeFile.scanFile(file, false);
        handleScanSuccess(decodedText);
      } catch (err) {
        setError("⚠️ No se pudo leer el QR. Asegúrate de que la imagen sea nítida y tenga el borde blanco completo.");
      }
    }
  };

  const openScanner = (mode: 'camera' | 'file') => {
    setError("");
    stopCamera().then(() => {
      setScanMode(mode);
      setShowScanner(true);
    });
  };

  const closeScanner = () => {
    stopCamera().then(() => {
      setShowScanner(false);
      setTimeout(() => setScanMode(null), 300);
    });
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) {
      setError("Por favor, ingresa el código del proyecto");
      return;
    }
    setError("");
    setIsLoading(true);
    
    setTimeout(() => {
      router.push(`/verificar/${searchId.trim()}`);
    }, 400);
  };

  const theme = THEMES[activeTheme];

  const cssVariables = {
    '--bg-grad': theme.bgGrad, '--header-grad': theme.headerGrad, '--card-bg': theme.cardBg,
    '--text-main': theme.textMain, '--text-sec': theme.textSec, '--text-muted': theme.textMuted,
    '--accent': theme.accent, '--accent-hover': theme.accentHover, '--accent-light': theme.accentLight,
    '--border': theme.border, '--glow': theme.glow, '--input-bg': theme.inputBg, '--box-bg': theme.boxBg,
    '--logo-shadow': theme.logoShadow
  } as React.CSSProperties;

  return (
    <div className="verificar-container" style={cssVariables}>
      <style jsx global>{`
        body, html { margin: 0 !important; padding: 0 !important; box-sizing: border-box; min-height: 100vh; }
      `}</style>

      <header className="verificar-header">
        <div className="verificar-header-content">
          <Link href="/caratulas" className="verificar-logo-link">
            <div className="logo-wrapper">
              <Image
                src={activeTheme === "light" ? "/images/logosibc.png" : "/images/logosib.png"}
                alt="SIB Logo"
                width={110}
                height={80}
                className="verificar-logo floating-logo"
                priority
              />
            </div>
          </Link>
          
          <div className="verificar-header-title">
            <h1>Sociedad de Ingenieros de Bolivia</h1>
            <p>Departamental La Paz</p>
          </div>
          
          <div className="theme-palette">
            {Object.entries(THEMES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key as keyof typeof THEMES)}
                className={`theme-circle ${activeTheme === key ? 'active' : ''}`}
                style={{ 
                  background: val.bgGrad,
                  border: `2px solid ${activeTheme === key ? val.accent : val.border}`,
                  boxShadow: activeTheme === key ? `0 0 10px ${val.accent}` : 'none'
                }}
                title={val.name}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="verificar-hero">
        <div className="verificar-hero-content animate-fade-in">
          
          <div className="hero-icon-container">
            <div className="icon-pulse"></div>
            <div className="verificar-icon-wrapper">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="verificar-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M9 15l2 2 4-4"></path>
              </svg>
            </div>
          </div>

          <h2 className="verificar-title-large">Verificador de Proyectos</h2>
          <p className="verificar-subtitle-large">
            Ingresa el código único o escanea el QR de la carátula para validar instantáneamente la autenticidad técnica del proyecto.
          </p>
          
          <form onSubmit={handleSearch} className="verificar-form">
            <div className="verificar-input-group">
              <input
                type="text"
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  setError("");
                }}
                placeholder="Ej: f103488954197367c06f..."
                className={`verificar-input ${error ? "verificar-input-error" : ""}`}
                disabled={isLoading}
              />
              <button type="submit" className="verificar-button" disabled={isLoading || !searchId.trim()}>
                {isLoading ? (
                  <span className="verificar-spinner" />
                ) : (
                  <>Consultar Registro</>
                )}
              </button>
            </div>
            {error && <p className="verificar-error animate-shake">{error}</p>}
          </form>
          
          <div className="verificar-divider">
            <span>Consultar mediante código QR</span>
          </div>

          {!showScanner ? (
            <div className="qr-options-grid">
              <button onClick={() => openScanner('camera')} className="verificar-qr-button camera-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                Usar Cámara
              </button>
              <button onClick={() => openScanner('file')} className="verificar-qr-button file-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                Subir Imagen QR
              </button>
            </div>
          ) : (
            <div className="scanner-active-container animate-fade-in">
              <div className="scanner-header">
                <h3>{scanMode === 'camera' ? '📷 Escaneando con Cámara' : '📁 Sube tu imagen QR'}</h3>
                <button onClick={closeScanner} className="close-scanner-btn">✖ Cerrar</button>
              </div>
              
              <div className="scanner-body">
                {scanMode === 'camera' ? (
                  <div className="camera-wrapper">
                    <div id="reader" className="custom-qr-reader"></div>
                    <p className="camera-hint">Apunta la cámara al código QR de la carátula</p>
                  </div>
                ) : (
                  <div className="file-upload-wrapper">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="file-input-custom"
                      id="qr-file-input"
                    />
                    <label htmlFor="qr-file-input" className="file-upload-label">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <span>Toca aquí para seleccionar una imagen de tu galería</span>
                    </label>
                  </div>
                )}
                
                {/* CONTENEDOR OCULTO PARA LEER ARCHIVOS (SOLUCIONA EL ERROR DE SUBIDA) */}
                <div id="reader-file-dummy" className="hidden-reader"></div>

              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="verificar-footer">
        <p>© {new Date().getFullYear()} Sociedad de Ingenieros de Bolivia - Departamental La Paz</p>
      </footer>

      <style jsx>{`
        .verificar-container {
          min-height: 100vh; background: var(--bg-grad); color: var(--text-main);
          font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column;
          transition: all 0.4s ease; width: 100%;
        }

        .verificar-header {
          background: var(--header-grad); backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50;
        }

        .verificar-header-content {
          max-width: 1200px; margin: 0 auto; padding: 12px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
        }

        .logo-wrapper { perspective: 1000px; }
        .floating-logo {
          filter: var(--logo-shadow); object-fit: contain;
          animation: float 4s ease-in-out infinite; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .verificar-logo-link:hover .floating-logo {
          transform: scale(1.1) rotateY(15deg); filter: drop-shadow(0 0 20px var(--accent)); animation-play-state: paused;
        }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }

        .verificar-header-title { text-align: center; }
        .verificar-header-title h1 { font-size: 1.5rem; margin: 0; color: var(--text-main); font-weight: 800; letter-spacing: 0.5px; }
        .verificar-header-title p { font-size: 0.85rem; margin: 4px 0 0 0; color: var(--text-sec); text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }

        .theme-palette { display: flex; gap: 10px; align-items: center; background: var(--box-bg); padding: 8px 16px; border-radius: 99px; border: 1px solid var(--border); }
        .theme-circle { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .theme-circle:hover { transform: scale(1.3); }
        .theme-circle.active { transform: scale(1.2); }

        .verificar-hero { flex: 1; display: flex; align-items: center; justify-content: center; padding: 60px 24px; }
        .verificar-hero-content {
          max-width: 800px; width: 100%; text-align: center; background: var(--card-bg); padding: 64px 48px; border-radius: 32px;
          border: 1px solid var(--border); box-shadow: var(--glow); backdrop-filter: blur(16px);
        }

        .hero-icon-container { position: relative; display: inline-flex; margin-bottom: 32px; }
        .icon-pulse {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120%; height: 120%; background: var(--accent);
          border-radius: 50%; filter: blur(25px); opacity: 0.4; animation: pulseGlow 3s infinite alternate; z-index: 0;
        }
        .verificar-icon-wrapper {
          position: relative; display: inline-flex; padding: 24px; background: var(--box-bg); border-radius: 32px; color: var(--accent);
          border: 2px solid var(--border); z-index: 1; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .hero-icon-container:hover .verificar-icon-wrapper {
          transform: scale(1.15) rotate(5deg); border-color: var(--accent); background: var(--accent-light); box-shadow: 0 10px 40px var(--accent-light);
        }

        .verificar-title-large {
          font-size: 3.8rem; font-weight: 900; margin: 0 0 20px 0; background: linear-gradient(to bottom right, #ffffff 0%, var(--accent) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -1.5px; line-height: 1.1; text-shadow: 0px 10px 30px rgba(0,0,0,0.2);
        }

        .verificar-subtitle-large { font-size: 1.2rem; color: var(--text-muted); margin-bottom: 48px; line-height: 1.6; max-width: 650px; margin-inline: auto; font-weight: 500; }

        .verificar-input-group { display: flex; gap: 16px; justify-content: center; }
        .verificar-input {
          flex: 1; padding: 22px 28px; background: var(--input-bg); border: 2px solid var(--border); border-radius: 20px; color: var(--text-main);
          font-size: 1.15rem; font-family: 'JetBrains Mono', monospace; transition: all 0.3s ease;
        }
        .verificar-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-light); transform: translateY(-2px); }
        
        .verificar-button {
          background: var(--accent); color: #000; border: none; border-radius: 20px; padding: 0 40px; font-weight: 800; font-size: 1.15rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .verificar-button:hover:not(:disabled) {
          background: var(--accent-hover); color: #fff; transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 25px var(--accent-light);
        }

        .verificar-error { color: #ef4444; font-size: 1rem; margin-top: 16px; font-weight: 600; }

        .verificar-divider { text-align: center; margin: 48px 0; position: relative; }
        .verificar-divider::before { content: ''; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); }
        .verificar-divider span { background: var(--card-bg); padding: 0 24px; color: var(--text-muted); position: relative; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }

        .qr-options-grid { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .verificar-qr-button {
          background: var(--box-bg); border: 2px solid var(--border); border-radius: 20px; padding: 18px 32px; font-weight: 800; font-size: 1.05rem; color: var(--text-sec); cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: inline-flex; align-items: center; gap: 12px;
        }
        .verificar-qr-button:hover { transform: translateY(-4px); box-shadow: var(--glow); border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

        .scanner-active-container { background: var(--box-bg); border: 2px solid var(--border); border-radius: 24px; padding: 24px; margin-top: 24px; box-shadow: var(--glow); }
        .scanner-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .scanner-header h3 { margin: 0; color: var(--text-main); font-size: 1.2rem; font-weight: 700; }
        .close-scanner-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .close-scanner-btn:hover { background: #ef4444; color: white; }

        /* LECTOR CÁMARA - UI MEJORADA */
        .camera-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .custom-qr-reader { width: 100%; max-width: 450px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 2px dashed var(--accent); background: #000; }
        .camera-hint { color: var(--text-muted); font-size: 0.9rem; margin: 0; font-weight: 500; }
        
        /* Aseguramos que el video de la cámara se vea bien */
        :global(#reader video) { object-fit: cover; border-radius: 14px; width: 100% !important; }
        :global(#reader__dashboard_section_csr span), :global(#reader__dashboard_section_csr div) { display: none !important; }
        :global(#html5-qrcode-anchor-scan-type-change) { display: none !important; }

        /* EL TRUCO PARA EL ARCHIVO: DIV INVISIBLE PERO EXISTENTE */
        .hidden-reader { position: absolute; top: -9999px; left: -9999px; width: 300px; height: 300px; visibility: hidden; }

        /* SUBIDA ARCHIVO */
        .file-upload-wrapper { width: 100%; display: flex; justify-content: center; }
        .file-input-custom { display: none; }
        .file-upload-label {
          display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px; border: 2px dashed var(--border); border-radius: 20px; background: rgba(0,0,0,0.2); cursor: pointer; transition: all 0.3s; width: 100%; max-width: 400px;
        }
        .file-upload-label:hover { border-color: var(--accent); background: var(--accent-light); transform: translateY(-2px); }
        .file-upload-label span { color: var(--text-main); font-weight: 600; font-size: 1.1rem; text-align: center; }

        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

        .verificar-spinner { width: 24px; height: 24px; border: 3px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .verificar-footer { background: var(--header-grad); border-top: 1px solid var(--border); padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.95rem; font-weight: 500; }

        @media (max-width: 768px) {
          .verificar-header-title h1 { font-size: 1.1rem; }
          .verificar-header-title p { font-size: 0.75rem; }
          .verificar-logo { width: 90px; height: 60px; }
          .verificar-hero-content { padding: 40px 24px; }
          .verificar-title-large { font-size: 2.6rem; }
          .verificar-input-group { flex-direction: column; }
          .verificar-button { padding: 20px; }
          .qr-options-grid { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}