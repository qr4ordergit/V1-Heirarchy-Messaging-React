import { AppShell } from "@mantine/core";
import { Outlet } from "react-router";

import Sidebar from "../../component/sidebar/Sidebar";
import BottomBar from "../../component/bottomBar/BottomBar";

export default function MainLayout() {
  return (
    <AppShell
      padding="md"
      navbar={{
        width: 70,
        breakpoint: "md",
      }}
    >
      <AppShell.Navbar visibleFrom="lg">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Footer hiddenFrom="lg">
        <BottomBar />
      </AppShell.Footer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}