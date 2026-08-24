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
    to: ROUTES.ACCOUNTS,
    icon: IconHome,
  },
  {
    label: "Chats",
    to: ROUTES.CHATS,
    icon: IconMessageCircle,
  },
  {
    label: "Contacts",
    to: ROUTES.CONTACT,
    icon: IconUsers,
  },
  {
    label: "Profile",
    to: ROUTES.PROFILE,
    icon: IconUser,
  },
];
