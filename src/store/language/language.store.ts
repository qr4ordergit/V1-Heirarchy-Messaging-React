import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SkinLanguageData {
  skinLanguageContent: Record<string, any>;
  skinLanguageList: Record<string, string>;
}

interface LanguageState {
  currentLang: string;
  languages: Record<string, string>;
  content: Record<string, any>;
  isLoaded: boolean;
  setLanguageData: (data: SkinLanguageData) => void;
  setLanguage: (lang: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      currentLang: "en",
      languages: {},
      content: {},
      isLoaded: false,

      setLanguageData: (data: SkinLanguageData) =>
        set((state) => ({
          languages: data.skinLanguageList || {},
          content: data.skinLanguageContent || {},
          isLoaded: true,
          currentLang:
            data.skinLanguageList && data.skinLanguageList[state.currentLang]
              ? state.currentLang
              : Object.keys(data.skinLanguageList || {})[0] || "en",
        })),

      setLanguage: (lang: string) => set({ currentLang: lang }),
    }),
    {
      name: "app_language_storage",
      partialize: (state) => ({ currentLang: state.currentLang, content : state.content }),
    },
  ),
);

export const useTranslation = () => {
  const currentLang = useLanguageStore((state) => state.currentLang);
  const content = useLanguageStore((state) => state.content);
  const languages = useLanguageStore((state) => state.languages);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const isLoaded = useLanguageStore((state) => state.isLoaded);

  const translation = (path: string, fallback: string = ""): string => {
    if (!content || !content[currentLang]) return fallback;

    const keys = path.split(".");
    let current: any = content[currentLang];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return fallback;
      }
    }

    return typeof current === "string" ? current : fallback;
  };

  return { translation, currentLang, languages, setLanguage, isLoaded };
};
