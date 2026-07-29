import { Suspense, lazy } from "react";
import { HashRouter, Route, Routes } from "react-router";

import { ROUTES } from "./routes";
import LazyLoader from "../component/lazyLoader/LazyLoader";
import Layout from "../pages/chats/Layout";
import Conversation from "../component/chats/conversation/Conversation";

const Home = lazy(() => import("../pages/home/Home"));
const NotFound = lazy(() => import("../pages/notFound/NotFound"));
const Signup = lazy(() => import("../pages/signup/Signup"));

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const AuthCallback = lazy(() => import("../pages/authCallback/AuthCallback"));

export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<LazyLoader />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.REGISTER} element={<Signup />} />

          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
          <Route path={ROUTES.CHATS} element={<Layout />}>
            <Route path={ROUTES.CONVERSATION_ID} element={<Conversation />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
