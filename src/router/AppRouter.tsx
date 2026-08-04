import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router";

import { ROUTES } from "./routes";
import LazyLoader from "../component/lazyLoader/LazyLoader";
import RequireAuth from "./guards/RequireAuth";
import RequireHub from "./guards/RequireHub";
import { useAuthStore } from "../store/auth/auth.store";

const Home = lazy(() => import("../pages/home/Home"));
const NotFound = lazy(() => import("../pages/notFound/NotFound"));
const Signup = lazy(() => import("../pages/signup/Signup"));
const Contact = lazy(() => import("../pages/contact/Contact"));
const Profile = lazy(() => import("../pages/profile/Profile"));

const Accounts = lazy(() => import("../pages/accounts/Accounts"));
const AuthCallback = lazy(() => import("../pages/authCallback/AuthCallback"));
const MainLayout = lazy(() => import("../layouts/mainLayout/MainLayout"));
const ChatsLayout = lazy(() => import("../layouts/chatsLayout/ChatsLayout"));
const EmptyChat = lazy(() => import("../pages/chats/EmptyChat"));
const Chats = lazy(() => import("../pages/chats/Chats"));

function useCaptureTokensAnywhere() {
  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");

    if (accessToken) {
      setTokens({
        accessToken,
        idToken: params.get("id_token") ?? "",
        refreshToken: params.get("refresh_token") ?? "",
      });

      const cleanHash = window.location.hash.split("?")[0];
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${cleanHash}`,
      );
    }
  }, [setTokens]);
}

export default function AppRouter() {
  useCaptureTokensAnywhere();

  return (
    <HashRouter>
      <Suspense fallback={<LazyLoader />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.REGISTER} element={<Signup />} />
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />

          <Route element={<RequireAuth />}>
            <Route element={<RequireHub />}>
              <Route path={ROUTES.ACCOUNTS} element={<Accounts />} />
            </Route>

            <Route element={<MainLayout />}>
              <Route path={ROUTES.CHATS} element={<ChatsLayout />}>
                <Route index element={<EmptyChat />} />
                <Route path=":chatId" element={<Chats />} />
              </Route>
              <Route path={ROUTES.CONTACT} element={<Contact />} />
              <Route path={ROUTES.PROFILE} element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
