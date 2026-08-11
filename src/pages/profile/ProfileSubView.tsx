import { Button, Card, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useAuthStore } from "../../store/auth/auth.store";

export type ProfileSectionType =
  | "account"
  | "privacy"
  | "help"
  | "about"
  | "switch-account";

interface ProfileSubViewProps {
  activeSection: ProfileSectionType;
  onBack: () => void;
}

const ProfileSubView = ({ activeSection, onBack }: ProfileSubViewProps) => {
  const userDetails = useAuthStore((state) => state.userDetails);

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <Stack gap="md" className="w-full">
            <Title order={3} className="text-gray-800">
              Account Settings
            </Title>
            <Card
              withBorder
              radius="lg"
              p={0}
              className="border-gray-200 bg-white"
            >
              <Stack gap={0}>
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                  <Text size="sm" c="dimmed" fw={500}>
                    Username
                  </Text>
                  <Text size="sm" fw={600} className="text-gray-800">
                    {userDetails?.username || "john.doe"}
                  </Text>
                </div>
                {/* <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                  <Text size="sm" c="dimmed" fw={500}>
                    Email
                  </Text>
                  <Text size="sm" fw={600} className="text-gray-800">
                    {userDetails?.email || "john.doe@email.com"}
                  </Text>
                </div> */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                  <Text size="sm" c="dimmed" fw={500}>
                    Phone
                  </Text>
                  <Text size="sm" fw={600} className="text-gray-800">
                    {/* {userDetails?.phone || "Not set"} */}Not set
                  </Text>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <Text size="sm" c="dimmed" fw={500}>
                    About
                  </Text>
                  <Text size="sm" fw={600} className="text-gray-800">
                    {/* {userDetails?.about || "Main hub account"} */}Main hub
                    account
                  </Text>
                </div>
              </Stack>
            </Card>
          </Stack>
        );

      case "privacy":
        return (
          <Stack gap="md" className="w-full">
            <Title order={3} className="text-gray-800">
              Privacy Settings
            </Title>
            <Card
              withBorder
              radius="lg"
              p="lg"
              className="border-gray-200 bg-white"
            >
              <Stack gap="sm">
                <Text fw={600} size="md">
                  Security & Visibility
                </Text>
                <Text size="sm" c="dimmed">
                  Manage who can view your active status, profile avatar, and
                  online status.
                </Text>
              </Stack>
            </Card>
          </Stack>
        );

      case "help":
        return (
          <Stack gap="md" className="w-full">
            <Title order={3} className="text-gray-800">
              Help & Support
            </Title>
            <Card
              withBorder
              radius="lg"
              p="lg"
              className="border-gray-200 bg-white"
            >
              <Stack gap="sm">
                <Text fw={600} size="md">
                  Need Assistance?
                </Text>
                <Text size="sm" c="dimmed">
                  Reach out to support at support@chathub.com or browse FAQs.
                </Text>
              </Stack>
            </Card>
          </Stack>
        );

      case "about":
        return (
          <Stack gap="md" className="w-full">
            <Title order={3} className="text-gray-800">
              About Chat-Hub
            </Title>
            <Card
              withBorder
              radius="lg"
              p="lg"
              className="border-gray-200 bg-white"
            >
              <Stack gap="xs">
                <Text fw={600} size="md">
                  Chat-Hub App
                </Text>
                <Text size="sm" c="dimmed">
                  Version 1.0.0
                </Text>
                <Text size="xs" c="dimmed" className="mt-2">
                  © 2026 Chat-Hub Inc. All rights reserved.
                </Text>
              </Stack>
            </Card>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Stack gap="md" className="w-full">
      <Button
        variant="subtle"
        color="indigo"
        size="sm"
        leftSection={<IconArrowLeft size={16} />}
        onClick={onBack}
        className="self-start px-0 hover:bg-transparent"
      >
        Back to Profile
      </Button>

      {renderContent()}
    </Stack>
  );
};

export default ProfileSubView;
