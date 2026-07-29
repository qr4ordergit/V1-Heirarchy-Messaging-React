import { Outlet } from "react-router";
import Sidebar from "../../component/chats/sidebar/Sidebar";
import Navbar from "../../component/navbar/Navbar";

function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <div>
        <Navbar />
      </div>
      <div className="grow min-h-0">
        <div className="flex h-full bg-gray-100">
          <div className="lg:w-3/12 md:w-4/12 w-full">
            <Sidebar />
          </div>
          <div className="w-9/12 hidden lg:block md:block">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
