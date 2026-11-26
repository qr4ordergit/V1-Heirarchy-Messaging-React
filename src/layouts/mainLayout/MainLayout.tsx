import './main.layout.css'
import { ActionIcon, Avatar, Box, Flex, Menu, Text, Tooltip } from "@mantine/core";
import { Outlet, useNavigate } from "react-router";

import Sidebar from "../../component/sidebar/Sidebar";
import BottomBar from "../../component/bottomBar/BottomBar";

import logo from '../../assets/logo.png'
import { useAuthStore } from '../../store/auth/auth.store';
import { IconCheck, IconLanguage, IconUser, IconUserFilled } from '@tabler/icons-react';
import { useTranslation } from '../../store/language/language.store';
import { useMediaQuery } from '@mantine/hooks';

export default function MainLayout() {
    const mobile = useMediaQuery("(max-width: 800px)");
  
  const target_user = useAuthStore((state) => state.target_user);
  const targetUserDetails = useAuthStore((state) => state.targetUserDetails);
  const userDetails = useAuthStore((state) => state.userDetails);
    const { translation, currentLang, languages, setLanguage } = useTranslation();
  
    const availableLanguages: [string, string][] = Object.entries(
    languages || {},
  ).filter((entry): entry is [string, string] => typeof entry[1] === "string");

  const activeUsername =
    targetUserDetails?.display_name ||
    userDetails?.display_name ||
    target_user ||
    userDetails?.username ||
    "";

    const navigate = useNavigate()

  return(
    <Box p={"xs"}>
    <Box className="main-layout">
      <Box className="logo">
        <img src={logo} alt="logo" />
      </Box>
      <Box className="top-bar">
          {mobile &&  <img src={logo} alt="logo"/>}
        <Box className='user-details'>
          <Avatar radius="md" color={"white"} bg={"var(--app-surface-light)"}><IconUser/></Avatar>
          <Text size="sm" c="white">
          {activeUsername}{" "}
        </Text>
        </Box>
        <Flex align={"center"} gap={"xs"}>
          <Menu shadow="md" width={160} position="bottom-end" withinPortal>
                <Menu.Target>
                  <Tooltip
                    label={translation(
                      "home-page.txtChangeLanguage",
                      "Change Language",
                    )}
                    position="bottom"
                    withArrow
                  >
                    <ActionIcon
                      variant="transparent"
                      color='white'
                      aria-label={translation(
                        "home-page.txtSelectLanguage",
                        "Select Language",
                      )}
                      className="border-gray-200 shadow-xs hover:bg-gray-100 transition-colors"
                    >
                      <IconLanguage size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>
                    {translation(
                      "home-page.txtSelectLanguage",
                      "Select Language",
                    )}
                  </Menu.Label>
                  {availableLanguages.length > 0 ? (
                    availableLanguages.map(([code, label]) => (
                      <Menu.Item
                        key={code}
                        onClick={() => setLanguage(code)}
                        rightSection={
                          currentLang === code ? (
                            <IconCheck
                              size={16}
                              color="var(--mantine-color-indigo-6)"
                            />
                          ) : null
                        }
                        fw={currentLang === code ? 700 : 400}
                      >
                        {label}
                      </Menu.Item>
                    ))
                  ) : (
                    <Menu.Item disabled>
                      {translation(
                        "home-page.txtLoadingLanguages",
                        "Loading languages...",
                      )}
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
              <IconUserFilled size={18} color='white'  style={{cursor : "pointer"}} onClick={()=>{navigate('/profile')}}/>
        </Flex>
      </Box>
      <Box className="side-bar">
      <Sidebar />
      </Box>
      <Box className="context">
      <Outlet />
      </Box>
      <Box className='bottom-bar'>
        <BottomBar />
      </Box>
    </Box>
    </Box>
  )
}
