"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────
// TEMAS Y ESTILOS (Sincronizados con verificar/page.tsx)
// ─────────────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    name: "Oscuro", bgGrad: "linear-gradient(160deg, #0f2419 0%, #1a3a2a 50%, #0a1a12 100%)",
    headerGrad: "linear-gradient(90deg, rgba(15,36,25,0.95), rgba(26,58,42,0.95))",
    cardBg: "rgba(255,255,255,0.03)", textMain: "#ffffff", textSec: "#a8d5b5", textMuted: "#8ca896",
    accent: "#4e9e6a", accentHover: "#3a7a52", accentLight: "rgba(78, 158, 106, 0.15)",
    border: "rgba(74,158,106,0.35)", glow: "0 8px 32px rgba(0,0,0,0.4)",
    inputBg: "rgba(0,0,0,0.2)", boxBg: "rgba(0,0,0,0.4)"
  },
  light: {
    name: "Claro", bgGrad: "linear-gradient(160deg, #f4faf6 0%, #e8f4ec 50%, #dcfce7 100%)",
    headerGrad: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(240,253,244,0.95))",
    cardBg: "rgba(255,255,255,0.8)", textMain: "#0f2419", textSec: "#2d5a3d", textMuted: "#5b7a66",
    accent: "#16a34a", accentHover: "#15803d", accentLight: "rgba(22, 163, 74, 0.15)",
    border: "rgba(22,163,74,0.25)", glow: "0 8px 30px rgba(0,0,0,0.06)",
    inputBg: "#ffffff", boxBg: "#f0fdf4"
  },
  engineering: {
    name: "Verde SIB", bgGrad: "linear-gradient(160deg, #051f11 0%, #0a3821 50%, #020d07 100%)",
    headerGrad: "linear-gradient(90deg, rgba(5,31,17,0.95), rgba(10,56,33,0.95))",
    cardBg: "rgba(34, 197, 94, 0.04)", textMain: "#ffffff", textSec: "#4ade80", textMuted: "#86efac",
    accent: "#22c55e", accentHover: "#16a34a", accentLight: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.4)", glow: "0 8px 32px rgba(34, 197, 94, 0.15)",
    inputBg: "rgba(0,0,0,0.4)", boxBg: "rgba(0,0,0,0.6)"
  }
};

// Mock data - DESPUÉS REEMPLAZAR CON CONSULTA A BD
const getMockData = (id: string) => ({
  id: id,
  titulo: "Proyecto de Construcción de Puente Vehicular",
  interesado: "Juan Pérez Mamani",
  ingNombre: "Ing. María Flores López",
  rni: "123456",
  fecha: new Date().toLocaleDateString(),
  hash: id,
  datos: {
    "Distrito Judicial": "La Paz",
    "Ubicación de Instalación": "Zona Sur, Calle 21",
    "Municipio": "La Paz",
    "Zona": "Calacoto",
    "Calle": "Calle 21",
    "NUREJ": "2024-001",
    "Número de Niveles": "4",
    "Altura Máxima Total del Muro": "12.5 m",
    "Superficie a Construir": "450.75 m²",
  },
  archivos: [
    { nombre: "plano_arquitectonico.pdf", tamaño: "2.4 MB", url: "#" },
    { nombre: "memoria_calculo.pdf", tamaño: "1.8 MB", url: "#" },
  ],
});

export default function DetalleCaratulaPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Estados de Tema sincronizados
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('engineering');
  const [activeFont, setActiveFont] = useState("'Inter', sans-serif");

  // Cargar preferencias guardadas desde el buscador
  useEffect(() => {
    const savedTheme = localStorage.getItem("sib-theme") as keyof typeof THEMES;
    const savedFont = localStorage.getItem("sib-font");
    
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme);
    if (savedFont) setActiveFont(savedFont);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (id && id.length > 10) {
          setData(getMockData(id));
        } else {
          setNotFound(true);
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const theme = THEMES[activeTheme];

  const cssVariables = {
    '--bg-grad': theme.bgGrad,
    '--header-grad': theme.headerGrad,
    '--card-bg': theme.cardBg,
    '--text-main': theme.textMain,
    '--text-sec': theme.textSec,
    '--text-muted': theme.textMuted,
    '--accent': theme.accent,
    '--accent-hover': theme.accentHover,
    '--accent-light': theme.accentLight,
    '--border': theme.border,
    '--glow': theme.glow,
    '--box-bg': theme.boxBg,
    '--font-family': activeFont,
  } as React.CSSProperties;

  if (isLoading) {
    return <LoadingScreen cssVars={cssVariables} />;
  }

  if (notFound || !data) {
    return <NotFoundScreen id={id} cssVars={cssVariables} />;
  }

  return (
    <div className="detalle-container" style={cssVariables}>
      <header className="detalle-header">
        <div className="detalle-header-content">
          <Link href="/verificar" className="logo-link">
            <Image
              src="/images/logosib.png"
              alt="SIB Logo"
              width={65}
              height={45}
              className="detalle-logo"
            />
          </Link>
          <div className="detalle-header-info">
            <h1>Sociedad de Ingenieros de Bolivia</h1>
            <p>Sistema de Verificación de Proyectos</p>
          </div>
          <Image
            src="/images/logosibc.png"
            alt="SIB Departamental"
            width={65}
            height={45}
            className="detalle-logo secondary-logo"
          />
        </div>
      </header>

      <main className="detalle-main">
        <div className="detalle-back">
          <Link href="/verificar" className="detalle-back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver al buscador
          </Link>
        </div>

        <div className="detalle-card animate-fade-in">
          <div className="detalle-card-header">
            <div className="detalle-status-row">
              <div className="detalle-status-badge valid">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Documento Auténtico
              </div>
              <div className="detalle-status-hash">
                <span>SHA-256</span>
                <code>{data.hash.slice(0, 24)}...</code>
              </div>
            </div>
            <h2>{data.titulo}</h2>
            <div className="detalle-meta">
              <span className="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Generado el {data.fecha}
              </span>
            </div>
          </div>

          <div className="detalle-section">
            <h3>Información General</h3>
            <div className="detalle-grid highlight-grid">
              <div className="detalle-field primary-field">
                <label>Interesado / Propietario</label>
                <span className="detalle-field-value">{data.interesado}</span>
              </div>
              <div className="detalle-field primary-field">
                <label>Ingeniero Proyectista</label>
                <span className="detalle-field-value">{data.ingNombre}</span>
              </div>
              <div className="detalle-field primary-field rni-field">
                <label>Registro Nacional de Ingenieros (RNI)</label>
                <span className="detalle-field-value">{data.rni}</span>
              </div>
            </div>
          </div>

          <div className="detalle-section">
            <h3>Datos Técnicos del Proyecto</h3>
            <div className="detalle-grid">
              {Object.entries(data.datos).map(([key, val]) => (
                <div className="detalle-field" key={key}>
                  <label>{key}</label>
                  <span className="detalle-field-value">{val as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detalle-section no-border">
            <h3>Archivos Adjuntos</h3>
            <div className="detalle-files">
              {data.archivos.map((file: any, idx: number) => (
                <div className="detalle-file-card" key={idx}>
                  <div className="file-icon-wrapper">
                    {file.nombre.endsWith('.pdf') ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    )}
                  </div>
                  <div className="file-details">
                    <span className="file-name">{file.nombre}</span>
                    <span className="file-size">{file.tamaño}</span>
                  </div>
                  <button className="btn-download" onClick={() => window.open(file.url, '_blank')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="detalle-footer">
        <p>© {new Date().getFullYear()} Sociedad de Ingenieros de Bolivia - Departamental La Paz</p>
      </footer>

      <style jsx>{`
        .detalle-container {
          min-height: 100vh;
          background: var(--bg-grad);
          display: flex;
          flex-direction: column;
          font-family: var(--font-family);
          color: var(--text-main);
          transition: all 0.4s ease;
        }

        .detalle-header {
          background: var(--header-grad);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .detalle-header-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .detalle-header-info { text-align: center; }
        .detalle-header-info h1 {
          font-size: 1.1rem; font-weight: 700; margin: 0 0 4px 0; color: var(--text-main);
        }
        .detalle-header-info p {
          font-size: 0.8rem; color: var(--text-sec); font-weight: 500; margin: 0; text-transform: uppercase;
        }

        .detalle-logo {
          object-fit: contain; transition: transform 0.2s ease;
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.1));
        }

        .logo-link:hover .detalle-logo { transform: scale(1.05); }

        .detalle-main { flex: 1; max-width: 900px; width: 100%; margin: 0 auto; padding: 40px 24px; }
        
        .detalle-back { margin-bottom: 24px; }
        .detalle-back-link {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--text-muted); text-decoration: none; font-size: 0.95rem; font-weight: 500; transition: color 0.2s;
        }
        .detalle-back-link:hover { color: var(--accent); }

        .detalle-card {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 16px; box-shadow: var(--glow);
          overflow: hidden; backdrop-filter: blur(12px);
        }

        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .detalle-card-header {
          padding: 32px; background: var(--box-bg); border-bottom: 1px solid var(--border);
        }

        .detalle-status-row {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px;
        }

        .detalle-status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: 999px; font-size: 0.85rem; font-weight: 600;
        }

        .detalle-status-badge.valid {
          background: var(--accent-light); color: var(--accent); border: 1px solid var(--border);
        }

        .detalle-status-hash {
          display: flex; align-items: center; gap: 8px;
          background: var(--box-bg); padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
        }
        .detalle-status-hash span { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
        .detalle-status-hash code { font-family: monospace; font-size: 0.8rem; color: var(--text-main); }

        .detalle-card-header h2 { font-size: 1.75rem; font-weight: 700; color: var(--text-main); margin: 0 0 12px 0; }
        .detalle-meta { display: flex; gap: 16px; color: var(--text-muted); font-size: 0.85rem; }
        .meta-item { display: flex; align-items: center; gap: 6px; }

        .detalle-section { padding: 32px; border-bottom: 1px solid var(--border); }
        .detalle-section.no-border { border-bottom: none; }
        
        .detalle-section h3 {
          color: var(--text-sec); font-size: 1.1rem; font-weight: 600; margin: 0 0 24px 0;
        }

        .detalle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .highlight-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }

        .detalle-field {
          display: flex; flex-direction: column; gap: 6px;
          padding: 12px 16px; background: var(--box-bg);
          border-radius: 10px; border: 1px solid transparent; transition: border 0.2s ease;
        }
        .detalle-field:hover { border-color: var(--border); }

        .primary-field { border-left: 3px solid var(--accent); }
        .rni-field { border-left: 3px solid #f59e0b; }

        .detalle-field label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
        .detalle-field-value { font-size: 1.05rem; color: var(--text-main); font-weight: 500; word-break: break-word; }

        .detalle-files { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

        .detalle-file-card {
          display: flex; align-items: center; gap: 16px; padding: 16px;
          background: var(--box-bg); border: 1px solid var(--border);
          border-radius: 12px; transition: all 0.2s ease;
        }
        .detalle-file-card:hover {
          transform: translateY(-2px); border-color: var(--accent); box-shadow: var(--glow);
        }

        .file-icon-wrapper {
          display: flex; align-items: center; justify-content: center;
          width: 48px; height: 48px; background: var(--card-bg); border-radius: 10px;
        }
        .file-details { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .file-name { color: var(--text-main); font-weight: 500; font-size: 0.95rem; }
        .file-size { font-size: 0.8rem; color: var(--text-muted); }

        .btn-download {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--accent-light); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 14px; color: var(--accent);
          font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-download:hover { background: var(--accent); color: var(--box-bg); }

        .detalle-footer {
          padding: 24px; text-align: center; border-top: 1px solid var(--border); background: var(--header-grad);
        }
        .detalle-footer p { color: var(--text-muted); font-size: 0.85rem; margin: 0; }

        @media (max-width: 768px) {
          .detalle-header-info h1 { font-size: 0.9rem; }
          .detalle-header-info p { font-size: 0.7rem; }
          .secondary-logo { display: none; }
          .detalle-card-header, .detalle-section { padding: 24px; }
          .detalle-card-header h2 { font-size: 1.4rem; }
          .detalle-status-row { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>
    </div>
  );
}

// Subcomponentes actualizados para recibir y aplicar las variables CSS
function LoadingScreen({ cssVars }: { cssVars: React.CSSProperties }) {
  return (
    <div className="loading-container" style={cssVars}>
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
      </div>
      <p>Verificando registro...</p>
      <style jsx>{`
        .loading-container {
          min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
          background: var(--bg-grad); font-family: var(--font-family); gap: 24px;
        }
        .spinner-wrapper { position: relative; width: 60px; height: 60px; }
        .loading-spinner {
          position: absolute; width: 100%; height: 100%;
          border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%;
          animation: spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
        }
        .loading-container p { color: var(--text-muted); font-weight: 500; letter-spacing: 0.5px; animation: pulse 2s infinite ease-in-out; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

function NotFoundScreen({ id, cssVars }: { id: string, cssVars: React.CSSProperties }) {
  return (
    <div className="notfound-container" style={cssVars}>
      <div className="notfound-card animate-fade-in">
        <div className="icon-wrapper">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        </div>
        <h2>Registro no encontrado</h2>
        <p>No se encontró ninguna carátula o proyecto asociado al código de verificación ingresado.</p>
        <div className="id-box">
          <span>Código consultado:</span>
          <code>{id}</code>
        </div>
        <Link href="/verificar" className="btn-return">
          Realizar nueva consulta
        </Link>
      </div>
      <style jsx>{`
        .notfound-container {
          min-height: 100vh; display: flex; justify-content: center; align-items: center;
          background: var(--bg-grad); font-family: var(--font-family); padding: 24px;
        }
        .notfound-card {
          background: var(--card-bg); border: 1px solid var(--border); backdrop-filter: blur(12px);
          padding: 40px; border-radius: 20px; text-align: center; max-width: 480px; width: 100%;
          box-shadow: var(--glow);
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .icon-wrapper { display: inline-flex; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; margin-bottom: 24px; }
        .notfound-card h2 { font-size: 1.5rem; color: var(--text-main); margin: 0 0 12px 0; }
        .notfound-card p { color: var(--text-muted); line-height: 1.6; margin: 0 0 24px 0; font-size: 0.95rem; }
        .id-box {
          background: var(--box-bg); padding: 16px; border-radius: 12px; margin-bottom: 32px; border: 1px solid var(--border);
        }
        .id-box span { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; }
        .id-box code { color: #ef4444; font-family: monospace; word-break: break-all; font-size: 0.9rem; }
        .btn-return {
          display: inline-block; background: var(--accent); color: var(--box-bg); text-decoration: none;
          padding: 12px 24px; border-radius: 10px; font-weight: 600; transition: all 0.2s ease; width: 100%;
        }
        .btn-return:hover { background: var(--accent-hover); transform: translateY(-2px); box-shadow: 0 8px 16px var(--accent-light); }
      `}</style>
    </div>
  );
}