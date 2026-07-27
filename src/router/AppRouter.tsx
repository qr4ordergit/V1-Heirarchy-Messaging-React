import { Suspense, lazy } from "react";
import { HashRouter, Route, Routes } from "react-router";

import { ROUTES } from "./routes";
import LazyLoader from "../component/lazyLoader/LazyLoader";

const Home = lazy(() => import("../pages/home/Home"));
const NotFound = lazy(() => import("../pages/notFound/NotFound"));

export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<LazyLoader />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}