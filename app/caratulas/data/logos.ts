export const CATEGORY_LOGOS: Record<string, { dark: string; light: string }> = {
  "Estructural":             { dark: "/especialidades/logo_estructural_b.png", light: "/especialidades/logo_estructural_w.png" },
  "Sanitario":               { dark: "/especialidades/logo_sanitario_b.png",   light: "/especialidades/logo_sanitario_w.png"   },
  "Geológico - Geotécnico":  { dark: "/especialidades/logo_geologico_b.png",   light: "/especialidades/logo_geologico_w.png"   },
  "Eléctrico":               { dark: "/especialidades/logo_electrico_b.png",   light: "/especialidades/logo_electrico_w.png"   },
  "Mecánico":                { dark: "/especialidades/logo_mecanico_b.png",    light: "/especialidades/logo_mecanico_w.png"    },
  "Ingeniería en General":   { dark: "/especialidades/logo_ingenieria_gral_b.png", light: "/especialidades/logo_ingenieria_gral_w.png" },
};

export const CARATULA_ASSETS = {
  imagenCentro: "/imagencentro.jpg",
  selloForCode: (code: string) => `/caratulas/sello-${code}.png`,
  selloDefault: "/caratulas/sello.png",
  logoEspecialidad: (mainCat: string): string => {
    const map: Record<string, string> = {
      "Estructural":            "/especialidades/logo_estructural_car.png",
      "Sanitario":              "/especialidades/logo_sanitario_car.png",
      "Geológico - Geotécnico": "/especialidades/logo_geologico_car.png",
      "Eléctrico":              "/especialidades/logo_electrico_car.png",
      "Mecánico":               "/especialidades/logo_mecanico_car.png",
      "Ingeniería en General":  "/especialidades/logo_ingenieria_gral_car.png",
    };
    return map[mainCat] ?? "/especialidades/logo_estructural_car.png";
  },
} as const;