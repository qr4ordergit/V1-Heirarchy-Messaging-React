import AppRouter from "./router/AppRouter";
import { useEffect } from "react";
import { useLanguageStore } from "./store/language/language.store";
import "./App.css";
export default function App() {
  const fetchSkinLanguages = useLanguageStore(
    (state) => state.fetchSkinLanguages,
  );

  useEffect(() => {
    void fetchSkinLanguages();
  }, [fetchSkinLanguages]);
  return <AppRouter />;
}
