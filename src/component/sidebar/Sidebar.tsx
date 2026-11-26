import { Stack } from "@mantine/core";
import SidebarItem from "./SidebarItem";
import { navigationItems } from "../../utils/navigation";
import { useTranslation } from "../../store/language/language.store";
export default function Sidebar() {
  const { translation } = useTranslation();
  
  return (
      <Stack align="center" pt={"10px"}>
        {navigationItems.map((item) => (
          <SidebarItem
            key={item.to}
            label={translation(`chat_page.${item.lang_id}`, item.label)}
            to={item.to}
            Icon={item.icon}
          />
        ))}
      </Stack>
  );
}
