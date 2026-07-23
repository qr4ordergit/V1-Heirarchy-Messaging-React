import { createHashRouter, RouterProvider } from "react-router-dom";
import './app.css'
import NotFound from "./pages/notFound/NotFound";
import Home from "./pages/home/Home";
import Chat from "./pages/chatPage/Chat";

const router = createHashRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
