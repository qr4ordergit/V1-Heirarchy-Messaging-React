import { NavLink } from "react-router";
import type { IconProps } from "@tabler/icons-react";
import { Box } from "@mantine/core";

interface SidebarItemProps {
  label: string;
  to: string;
  Icon: React.ComponentType<IconProps>;
}

export default function SidebarItem({ to, Icon }: SidebarItemProps) {
  return (
    <NavLink to={to}>
      {({ isActive }) =><Box  style={{backgroundColor : isActive ? 'var(--app-surface-light)' : "transparent", borderRadius : '10px', padding : "10px"}}><Icon color={"white"} /></Box> }
    </NavLink>
  );
}
