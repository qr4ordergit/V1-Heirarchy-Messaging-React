import { Box, Group } from "@mantine/core";
import { NavLink } from "react-router";
import { navigationItems } from "../../utils/navigation";

export default function BottomBar() {
  return (
    <Group
      justify="space-around"
    >
      {navigationItems.map(({ icon: Icon, to }) => (
        <NavLink to={to}>
              {({ isActive }) =><Box  style={{backgroundColor : isActive ? 'var(--app-surface-light)' : "transparent", borderRadius : '10px', padding : "10px"}}><Icon color={"white"} /></Box> }
            </NavLink>
      ))}
    </Group>
  );
}
