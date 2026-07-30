import { Suspense, lazy } from "react";
import { HashRouter, Route, Routes } from "react-router";

import { ROUTES } from "./routes";
import LazyLoader from "../component/lazyLoader/LazyLoader";
import DashboardLayout from "../layouts/DashboardLayout";
import Conversation from "../component/chats/conversation/Conversation";
import { ChatSection } from "../pages/chats/ChatSection";

const Home = lazy(() => import("../pages/home/Home"));
const NotFound = lazy(() => import("../pages/notFound/NotFound"));
const Signup = lazy(() => import("../pages/signup/Signup"));

const Accounts = lazy(() => import("../pages/accounts/Accounts"));
const AuthCallback = lazy(() => import("../pages/authCallback/AuthCallback"));

export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<LazyLoader />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.REGISTER} element={<Signup />} />

          <Route path={ROUTES.ACCOUNTS} element={<Accounts />} />
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardLayout />}>
            <Route path={ROUTES.CHATS} element={<ChatSection />}>
              <Route path={ROUTES.CONVERSATION_ID} element={<Conversation />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
