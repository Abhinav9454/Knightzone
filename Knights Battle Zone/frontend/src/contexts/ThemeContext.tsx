import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppTheme = "light" | "dark";
export type AccentTheme = "cyan" | "emerald" | "rose" | "amber" | "violet";
export type HighlightTheme = "cyan" | "lime" | "amber" | "pink";
export type FontScale = "sm" | "md" | "lg";
export type FontFamilyTheme = "mono" | "sans" | "serif";
export type CursorStyle = "beam" | "block";

type ThemeContextType = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  ecoMode: boolean;
  setEcoMode: (enabled: boolean) => void;
  accentTheme: AccentTheme;
  setAccentTheme: (theme: AccentTheme) => void;
  highlightTheme: HighlightTheme;
  setHighlightTheme: (theme: HighlightTheme) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  fontFamilyTheme: FontFamilyTheme;
  setFontFamilyTheme: (theme: FontFamilyTheme) => void;
  cursorStyle: CursorStyle;
  setCursorStyle: (style: CursorStyle) => void;
  keyboardSoundEnabled: boolean;
  setKeyboardSoundEnabled: (enabled: boolean) => void;
};

const STORAGE_KEY = "app-theme";
const ECO_STORAGE_KEY = "app-eco-mode";
const ACCENT_STORAGE_KEY = "app-accent-theme";
const HIGHLIGHT_STORAGE_KEY = "app-highlight-theme";
const FONT_SCALE_STORAGE_KEY = "app-font-scale";
const FONT_FAMILY_STORAGE_KEY = "app-font-family-theme";
const CURSOR_STYLE_STORAGE_KEY = "app-cursor-style";
const KEY_SOUND_STORAGE_KEY = "app-keyboard-sound";
const DEFAULT_THEME: AppTheme = "dark";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (saved === "light" || saved === "dark") return saved;
    return DEFAULT_THEME;
  });
  const [ecoMode, setEcoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(ECO_STORAGE_KEY);
    return saved === "true";
  });
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(() => {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY) as AccentTheme | null;
    if (saved === "cyan" || saved === "emerald" || saved === "rose" || saved === "amber" || saved === "violet") return saved;
    return "cyan";
  });
  const [highlightTheme, setHighlightTheme] = useState<HighlightTheme>(() => {
    const saved = localStorage.getItem(HIGHLIGHT_STORAGE_KEY) as HighlightTheme | null;
    if (saved === "cyan" || saved === "lime" || saved === "amber" || saved === "pink") return saved;
    return "cyan";
  });
  const [fontScale, setFontScale] = useState<FontScale>(() => {
    const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY) as FontScale | null;
    if (saved === "sm" || saved === "md" || saved === "lg") return saved;
    return "md";
  });
  const [fontFamilyTheme, setFontFamilyTheme] = useState<FontFamilyTheme>(() => {
    const saved = localStorage.getItem(FONT_FAMILY_STORAGE_KEY) as FontFamilyTheme | null;
    if (saved === "mono" || saved === "sans" || saved === "serif") return saved;
    return "sans";
  });
  const [cursorStyle, setCursorStyle] = useState<CursorStyle>(() => {
    const saved = localStorage.getItem(CURSOR_STYLE_STORAGE_KEY) as CursorStyle | null;
    if (saved === "beam" || saved === "block") return saved;
    return "beam";
  });
  const [keyboardSoundEnabled, setKeyboardSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(KEY_SOUND_STORAGE_KEY);
    return saved === "true";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-eco", ecoMode ? "on" : "off");
    localStorage.setItem(ECO_STORAGE_KEY, String(ecoMode));
  }, [ecoMode]);



  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accentTheme);
    localStorage.setItem(ACCENT_STORAGE_KEY, accentTheme);
  }, [accentTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-highlight", highlightTheme);
    localStorage.setItem(HIGHLIGHT_STORAGE_KEY, highlightTheme);
  }, [highlightTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontScale);
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font-family", fontFamilyTheme);
    localStorage.setItem(FONT_FAMILY_STORAGE_KEY, fontFamilyTheme);
  }, [fontFamilyTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-cursor-style", cursorStyle);
    localStorage.setItem(CURSOR_STYLE_STORAGE_KEY, cursorStyle);
  }, [cursorStyle]);

  useEffect(() => {
    localStorage.setItem(KEY_SOUND_STORAGE_KEY, String(keyboardSoundEnabled));
  }, [keyboardSoundEnabled]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      ecoMode,
      setEcoMode,
      accentTheme,
      setAccentTheme,
      highlightTheme,
      setHighlightTheme,
      fontScale,
      setFontScale,
      fontFamilyTheme,
      setFontFamilyTheme,
      cursorStyle,
      setCursorStyle,
      keyboardSoundEnabled,
      setKeyboardSoundEnabled,
    }),
    [
      theme,
      ecoMode,
      accentTheme,
      highlightTheme,
      fontScale,
      fontFamilyTheme,
      cursorStyle,
      keyboardSoundEnabled,
    ],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
