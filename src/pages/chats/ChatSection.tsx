import { Outlet } from "react-router";
import Sidebar from "../../component/chats/sidebar/Sidebar";

export function ChatSection() {
  return (
    <div className="w-11/12">
      <div className="flex h-full">
        <div className="w-3/12">
          <Sidebar />
        </div>
        <div className="w-9/12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
