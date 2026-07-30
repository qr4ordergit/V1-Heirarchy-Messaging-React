import { Outlet } from "react-router";
import Navbar from "../component/navbar/Navbar";
import NavigationBar from "../component/chats/navigation_bar/NavigationBar";

function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen">
      <div>
        <Navbar />
      </div>
      <div className="grow min-h-0">
        <div className="flex h-full bg-gray-100">
          <div className="w-1/12 bg-white">
            <NavigationBar />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
