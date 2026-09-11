import { create } from "zustand";
import { SKIN_LANGUAGE_URL } from "../../utils/constant";

const STORAGE_LANG_KEY = "app_selected_lang";
const STORAGE_DATA_KEY = "app_skin_language_data";

export interface SkinLanguageData {
  skinLanguageContent?: Record<string, any>;
  skinLanguageList?: Record<string, string>;
  [key: string]: any;
}

interface LanguageState {
  currentLang: string;
  languages: Record<string, string>;
  content: Record<string, any>;
  isLoaded: boolean;
  setLanguage: (lang: string) => void;
  fetchSkinLanguages: () => Promise<void>;
}

const getInitialData = (): {
  currentLang: string;
  languages: Record<string, string>;
  content: Record<string, any>;
} => {
  try {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY) || "en";
    const rawData = localStorage.getItem(STORAGE_DATA_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      return {
        currentLang: savedLang,
        languages: parsed.languages || { en: "English" },
        content: parsed.content || {},
      };
    }
    return {
      currentLang: savedLang,
      languages: { en: "English" },
      content: {},
    };
  } catch (e) {
    return {
      currentLang: "en",
      languages: { en: "English" },
      content: {},
    };
  }
};

const initial = getInitialData();

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLang: initial.currentLang,
  languages: initial.languages,
  content: initial.content,
  isLoaded: Object.keys(initial.content).length > 0,

  setLanguage: (lang: string) => {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    set({ currentLang: lang });
  },

  fetchSkinLanguages: async () => {
    try {
      const response = await fetch(SKIN_LANGUAGE_URL);
      if (!response.ok) return;

      const data: SkinLanguageData = await response.json();

      const rawList = data?.skinLanguageList || {};
      const cleanLanguages: Record<string, string> = {};

      if (rawList && typeof rawList === "object") {
        Object.entries(rawList).forEach(([code, label]) => {
          if (typeof label === "string") {
            cleanLanguages[code] = label;
          }
        });
      }

      const finalLanguages =
        Object.keys(cleanLanguages).length > 0
          ? cleanLanguages
          : { en: "English" };
      const finalContent = data?.skinLanguageContent || {};

      localStorage.setItem(
        STORAGE_DATA_KEY,
        JSON.stringify({
          languages: finalLanguages,
          content: finalContent,
        }),
      );

      const activeLang = get().currentLang;
      const validLang = finalLanguages[activeLang]
        ? activeLang
        : Object.keys(finalLanguages)[0] || "en";

      localStorage.setItem(STORAGE_LANG_KEY, validLang);

      set({
        languages: finalLanguages,
        content: finalContent,
        currentLang: validLang,
        isLoaded: true,
      });
    } catch (error) {
      console.error("Failed to load skin languages:", error);
    }
  },
}));

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

  return {
    translation,
    t: translation,
    currentLang,
    languages,
    setLanguage,
    isLoaded,
  };
};
