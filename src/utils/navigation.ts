import {
  IconHome,
  IconMessageCircle,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { ROUTES } from "../router/routes";

export const navigationItems = [
  {
    label: "Home",
    lang_id : "nav1",
    to: ROUTES.ACCOUNTS,
    icon: IconHome,
  },
  {
    label: "Chats",
    lang_id : "nav2",
    to: ROUTES.CHATS,
    icon: IconMessageCircle,
  },
  {
    label: "Contacts",
    lang_id : "nav3",
    to: ROUTES.CONTACT,
    icon: IconUsers,
  },
  {
    label: "Profile",
    lang_id : "nav4",
    to: ROUTES.PROFILE,
    icon: IconUser,
  },
];
