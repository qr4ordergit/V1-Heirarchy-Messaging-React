import { create } from "zustand";

const STORAGE_LANG_KEY = "app_selected_lang";
const STORAGE_LANG_LIST_KEY = "app_skin_language_list";
const STORAGE_CONTENT_KEY = "app_skin_language_content";

export const SKIN_LANGUAGE_BASE_URL =
  import.meta.env.VITE_SKIN_LANGUAGE_API_URL ||
  "https://messaging-service-media.s3.ap-south-1.amazonaws.com/skin-languages";

export const LANGUAGE_LIST_URL = `${SKIN_LANGUAGE_BASE_URL}/language_list.json`;

export const getLanguageJsonUrl = (lang: string) =>
  `${SKIN_LANGUAGE_BASE_URL}/${lang}/${lang}_language.json`;

interface LanguageState {
  currentLang: string;
  languages: Record<string, string>;
  content: Record<string, any>;
  isLoaded: boolean;
  isLoadingLanguage: boolean;
  setLanguage: (lang: string) => Promise<void>;
  fetchSkinLanguages: () => Promise<void>;
  fetchLanguageContent: (lang: string) => Promise<void>;
}

const getInitialData = () => {
  try {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY) || "en";
    const rawList = localStorage.getItem(STORAGE_LANG_LIST_KEY);
    const rawContent = localStorage.getItem(STORAGE_CONTENT_KEY);

    const languages: Record<string, string> = rawList
      ? JSON.parse(rawList)
      : { en: "English" };
    const content: Record<string, any> = rawContent
      ? JSON.parse(rawContent)
      : {};

    return {
      currentLang: savedLang,
      languages,
      content,
      isLoaded: Boolean(content[savedLang]),
    };
  } catch (e) {
    return {
      currentLang: "en",
      languages: { en: "English" },
      content: {},
      isLoaded: false,
    };
  }
};

const initial = getInitialData();

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLang: initial.currentLang,
  languages: initial.languages,
  content: initial.content,
  isLoaded: initial.isLoaded,
  isLoadingLanguage: false,

  fetchLanguageContent: async (lang: string) => {
    if (get().content[lang]) {
      set({ currentLang: lang, isLoaded: true, isLoadingLanguage: false });
      return;
    }

    set({ isLoadingLanguage: true });
    try {
      const response = await fetch(getLanguageJsonUrl(lang));
      if (!response.ok) {
        throw new Error(`Failed to fetch language bundle for ${lang}`);
      }

      const langData = await response.json();

      const updatedContent = {
        ...get().content,
        [lang]: langData,
      };

      try {
        localStorage.setItem(
          STORAGE_CONTENT_KEY,
          JSON.stringify(updatedContent),
        );
      } catch (err) {
        console.warn("Storage quota exceeded caching language bundle", err);
      }

      set({
        content: updatedContent,
        currentLang: lang,
        isLoaded: true,
        isLoadingLanguage: false,
      });
    } catch (error) {
      console.error(`Failed to load ${lang} translation json:`, error);
      set({ isLoadingLanguage: false });
    }
  },

  setLanguage: async (lang: string) => {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    await get().fetchLanguageContent(lang);
  },

  fetchSkinLanguages: async () => {
    try {
      const response = await fetch(LANGUAGE_LIST_URL);
      if (!response.ok) return;

      const langList: Record<string, string> = await response.json();
      const cleanLanguages: Record<string, string> = {};

      if (langList && typeof langList === "object") {
        Object.entries(langList).forEach(([code, label]) => {
          if (typeof label === "string") {
            cleanLanguages[code] = label;
          }
        });
      }

      const finalLanguages =
        Object.keys(cleanLanguages).length > 0
          ? cleanLanguages
          : { en: "English" };

      localStorage.setItem(
        STORAGE_LANG_LIST_KEY,
        JSON.stringify(finalLanguages),
      );

      const activeLang = get().currentLang;
      const validLang = finalLanguages[activeLang]
        ? activeLang
        : Object.keys(finalLanguages)[0] || "en";

      localStorage.setItem(STORAGE_LANG_KEY, validLang);

      set({
        languages: finalLanguages,
        currentLang: validLang,
      });

      await get().fetchLanguageContent(validLang);
    } catch (error) {
      console.error("Failed to load language list:", error);
      await get().fetchLanguageContent(get().currentLang || "en");
    }
  },
}));

export const useTranslation = () => {
  const currentLang = useLanguageStore((state) => state.currentLang);
  const content = useLanguageStore((state) => state.content);
  const languages = useLanguageStore((state) => state.languages);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const isLoaded = useLanguageStore((state) => state.isLoaded);
  const isLoadingLanguage = useLanguageStore(
    (state) => state.isLoadingLanguage,
  );

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
    isLoadingLanguage,
  };
};

export const getTranslation = (path: string, fallback: string = ""): string => {
  const state = useLanguageStore.getState();
  const { content, currentLang } = state;

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
