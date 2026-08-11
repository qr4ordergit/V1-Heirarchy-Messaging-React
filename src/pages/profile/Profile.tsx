import { useState } from "react";
import {
  Avatar,
  Card,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronRight,
  IconCircle,
  IconInfoCircle,
  IconLock,
  IconLogout,
  IconSettings,
  IconSwitch3,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth/auth.store";
import ProfileSubView, { type ProfileSectionType } from "./ProfileSubView";
import { logout } from "../../api/authApi";
import { ROUTES } from "../../router/routes";

export interface ProfileOption {
  id: ProfileSectionType;
  label: string;
  icon: React.ReactNode;
}

const Profile = () => {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const userDetails = useAuthStore((state) => state.userDetails);

  const [activeSection, setActiveSection] = useState<ProfileSectionType | null>(
    null,
  );

  const profileOptions: ProfileOption[] = [
    {
      id: "account",
      label: "Account Settings",
      icon: <IconSettings size={20} className="text-indigo-600" />,
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: <IconLock size={20} className="text-indigo-600" />,
    },
    {
      id: "help",
      label: "Help & Support",
      icon: <IconCircle size={20} className="text-indigo-600" />,
    },
    {
      id: "about",
      label: "About",
      icon: <IconInfoCircle size={20} className="text-indigo-600" />,
    },
    {
      id: "switch-account",
      label: "Switch Account",
      icon: <IconSwitch3 size={20} className="text-indigo-600" />,
    },
  ];

  //   const handleSwitchAccount = () => {
  //     // logout();
  //     navigate("/login");
  //   };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearTokens();
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  const username = userDetails?.username || "mbr-default-581";
  const userInitials =
    username
      .split("-")
      .map((part: string) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "M";

  return (
    <div className="w-full px-1 h-full">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] overflow-hidden bg-white">
        {/* Main Content Area (7/12 Width) */}
        <div className="w-full md:w-7/12 bg-white">
          <Stack p={{ base: "md", sm: "xl" }} gap="md" className="h-full">
            {activeSection !== null ? (
              <ProfileSubView
                activeSection={activeSection}
                onBack={() => setActiveSection(null)}
              />
            ) : (
              <>
                <div className="flex flex-col items-center justify-center pt-2 pb-4 gap-2">
                  <Avatar
                    color="indigo"
                    radius="xl"
                    size={84}
                    className="text-2xl font-bold shadow-sm"
                  >
                    {userInitials}
                  </Avatar>

                  <Text
                    fw={700}
                    size="lg"
                    className="mt-3 text-gray-800 tracking-wide"
                  >
                    {username}
                  </Text>
                </div>

                <div className="w-full space-y-3">
                  {profileOptions.map((option) => (
                    <Card
                      key={option.id}
                      withBorder
                      radius="lg"
                      p={0}
                      className="w-full transition-all duration-200 border-gray-200/90 shadow-xs hover:shadow-sm bg-white hover:bg-gray-50/80"
                    >
                      <UnstyledButton
                        onClick={() => setActiveSection(option.id)}
                        className="w-full px-5 py-4"
                      >
                        <Group justify="space-between">
                          <Group gap="md">
                            <div className="p-2 rounded-lg bg-indigo-50 flex items-center justify-center">
                              {option.icon}
                            </div>
                            <Text fw={600} size="md" className="text-gray-800">
                              {option.label}
                            </Text>
                          </Group>
                          <IconChevronRight
                            size={18}
                            className="text-gray-400"
                          />
                        </Group>
                      </UnstyledButton>
                    </Card>
                  ))}

                  <Card
                    withBorder
                    radius="lg"
                    p={0}
                    className="w-full border-gray-200/90 shadow-xs bg-white hover:bg-red-50/40 hover:border-red-200 transition-all duration-200"
                  >
                    <UnstyledButton
                      onClick={handleLogout}
                      className="w-full px-5 py-4"
                    >
                      <Group justify="space-between">
                        <Group gap="md">
                          <div className="p-2 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                            <IconLogout size={20} />
                          </div>
                          <Text fw={600} size="md" className="text-red-500">
                            Logout
                          </Text>
                        </Group>
                      </Group>
                    </UnstyledButton>
                  </Card>
                </div>
              </>
            )}
          </Stack>
        </div>
      </div>
    </div>
  );
};

export default Profile;
