import { AppShell, Box } from "@mantine/core";
import { Outlet } from "react-router";

import Sidebar from "../../component/sidebar/Sidebar";
import BottomBar from "../../component/bottomBar/BottomBar";

export default function MainLayout() {
  return (
   <AppShell
  h="100dvh"
  padding="md"
  navbar={{
    width: 70,
    breakpoint: "lg",
  }}
>
  <AppShell.Navbar visibleFrom="lg">
    <Sidebar />
  </AppShell.Navbar>

  <AppShell.Main pb={{ base: 70, lg: 15 }} className="h-full">
    <Outlet />
  </AppShell.Main>

  <Box
    hiddenFrom="lg"
    pos="fixed"
    bottom={0}
    left={0}
    right={0}
    h={50}
    bg="white"
    style={{ borderTop: "1px solid #e9ecef", zIndex: 1000 }}
  >
    <BottomBar />
  </Box>
</AppShell>
  );
}
