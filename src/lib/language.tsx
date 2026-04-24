"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

type Lang = "ja" | "en";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: <T extends ReactNode>(ja: T, en: T) => T;
}

const STORAGE_KEY = "daimasu-lang";

const LangContext = createContext<LangContextType>({
  lang: "ja",
  setLang: () => {},
  t: (ja) => ja,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ja");

  // Hydration-safe bootstrap: SSR + first client render both use "ja" (match).
  // After hydration, adopt stored/browser preference with a second render if needed.
  useEffect(() => {
    let shouldSwitchToEn = false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en") shouldSwitchToEn = true;
      else if (stored !== "ja" && !navigator.language.startsWith("ja"))
        shouldSwitchToEn = true;
    } catch {
      /* private browsing, no-op */
    }
    if (shouldSwitchToEn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe bootstrap from external storage/navigator
      setLangState("en");
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      /* no-op */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    <T extends ReactNode>(ja: T, en: T): T => (lang === "ja" ? ja : en),
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
