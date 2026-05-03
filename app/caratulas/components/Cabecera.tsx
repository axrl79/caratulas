// components/Cabecera/index.tsx
import Image from "next/image";
import { memo, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark" | "engineering";

export interface ThemeColors {
  headerGrad: string;
  border: string;
  textMain: string;
  textMuted: string;
  accent: string;
  inputBg: string;
  glow: string;
  buttonHover?: string;
  buttonActive?: string;
}

interface CabeceraProps {
  themeMode: ThemeMode;
  C: ThemeColors;
  onOpenSettings: () => void;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS (extracted magic values)
// ─────────────────────────────────────────────────────────────
const HEADER_HEIGHT = 76;
const LOGO_WIDTH = 90;
const LOGO_HEIGHT = 55;
const DIVIDER_WIDTH = 1;
const DIVIDER_HEIGHT = 40;

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
const Cabecera = memo(function Cabecera({ 
  themeMode, 
  C, 
  onOpenSettings 
}: CabeceraProps) {
  
  // Optimized logo path selection
  const logoSrc = themeMode === "light" 
    ? "/images/logosibc.png" 
    : "/images/logosib.png";
    
  // Accessibility: handle keyboard activation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenSettings();
    }
  }, [onOpenSettings]);

  return (
    <header 
      className="cabecera"
      style={{
        background: C.headerGrad,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)", // Safari support
        borderBottom: `1px solid ${C.border}`,
        boxShadow: C.glow,
      }}
    >
      <div className="cabecera__container">
        
        {/* Logo Section */}
        <div className="cabecera__logo-wrapper">
          <Image
            src={logoSrc}
            alt="Sociedad de Ingenieros de Bolivia - Logo oficial"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority
            loading="eager"
            className="cabecera__logo"
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Visual Divider */}
        <span 
          className="cabecera__divider" 
          style={{ background: C.border }} 
          aria-hidden="true"
        />

        {/* Title Section */}
        <div className="cabecera__titles">
          <h1 className="cabecera__main-title" style={{ color: C.textMain }}>
            Sociedad de Ingenieros de Bolivia{" "}
            <span className="cabecera__accent" style={{ color: C.accent }}>
              Departamental La Paz
            </span>
          </h1>
          <p className="cabecera__subtitle" style={{ color: C.textMuted }}>
            Asistente de Generador de Carátulas
          </p>
        </div>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          onKeyDown={handleKeyDown}
          className="cabecera__settings-btn"
          style={{
            background: C.inputBg,
            border: `1px solid ${C.border}`,
            color: C.textMain,
            "--btn-hover": C.buttonHover || C.inputBg,
            "--btn-active": C.buttonActive || C.border,
          } as React.CSSProperties}
          aria-label="Abrir panel de personalización de temas y configuración"
          aria-haspopup="dialog"
        >
          <span className="cabecera__btn-icon" aria-hidden="true">⚙️</span>
          <span className="cabecera__btn-text">Personalizar</span>
          <span className="cabecera__btn-glow" aria-hidden="true" />
        </button>

      </div>

      {/* Inline styles for animations & responsive (could be extracted to CSS module) */}
      <style jsx>{`
        .cabecera {
          position: sticky;
          top: 0;
          z-index: 50;
          height: ${HEADER_HEIGHT}px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }
        
        .cabecera__container {
          display: flex;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }
        
        /* Logo */
        .cabecera__logo-wrapper {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .cabecera__logo-wrapper:hover {
          transform: scale(1.02);
        }
        .cabecera__logo {
          transition: filter 0.3s ease, transform 0.3s ease;
        }
        
        /* Divider */
        .cabecera__divider {
          width: ${DIVIDER_WIDTH}px;
          height: ${DIVIDER_HEIGHT}px;
          border-radius: 1px;
          flex-shrink: 0;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        
        /* Titles */
        .cabecera__titles {
          flex: 1;
          min-width: 0; // Prevent flex overflow
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0px;
        }
        .cabecera__main-title {
          font-weight: 800;
          font-size: 1.25rem;
          line-height: 1.2;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cabecera__accent {
          font-weight: 700;
          position: relative;
          display: inline-block;
        }
        .cabecera__accent::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: currentColor;
          opacity: 0.2;
          border-radius: 1px;
        }
        .cabecera__subtitle {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.9;
          transition: opacity 0.2s ease;
          margin-top: -4px;
        }
        
        /* Settings Button */
        .cabecera__settings-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          user-select: none;
          position: relative;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }
        .cabecera__settings-btn:hover {
          background: var(--btn-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .cabecera__settings-btn:active {
          transform: translateY(0);
          border-color: var(--btn-active);
        }
        .cabecera__settings-btn:focus-visible {
          outline: 2px solid ${C.accent};
          outline-offset: 2px;
        }
        .cabecera__btn-icon {
          font-size: 1.1em;
          transition: transform 0.2s ease;
        }
        .cabecera__settings-btn:hover .cabecera__btn-icon {
          transform: rotate(15deg);
        }
        .cabecera__btn-text {
          position: relative;
          z-index: 1;
        }
        
        /* Subtle glow effect on button */
        .cabecera__btn-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            ${C.accent}20,
            transparent 40%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .cabecera__settings-btn:hover .cabecera__btn-glow {
          opacity: 1;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
          .cabecera {
            padding: 0 16px;
          }
          .cabecera__main-title {
            font-size: 1.1rem;
          }
          .cabecera__subtitle {
            font-size: 0.7rem;
          }
        }
        
        @media (max-width: 768px) {
          .cabecera__container {
            gap: 12px;
          }
          .cabecera__logo {
            width: 70px;
            height: 42px;
          }
          .cabecera__divider {
            height: 32px;
          }
          .cabecera__titles {
            gap: 1px;
          }
          .cabecera__main-title {
            font-size: 0.95rem;
          }
          .cabecera__subtitle {
            font-size: 0.65rem;
            letter-spacing: 0.1em;
          }
          .cabecera__settings-btn {
            padding: 8px 14px;
            font-size: 0.85rem;
          }
          .cabecera__btn-text {
            display: none; /* Hide text on mobile, keep icon */
          }
        }
        
        @media (max-width: 480px) {
          .cabecera {
            height: auto;
            padding: 12px 16px;
          }
          .cabecera__container {
            flex-wrap: wrap;
            justify-content: space-between;
          }
          .cabecera__logo {
            width: 60px;
            height: 36px;
          }
          .cabecera__divider {
            display: none;
          }
          .cabecera__titles {
            order: 3;
            width: 100%;
            margin-top: 8px;
            align-items: flex-start;
          }
          .cabecera__main-title {
            font-size: 1rem;
          }
        }
        
        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </header>
  );
});

export default Cabecera;