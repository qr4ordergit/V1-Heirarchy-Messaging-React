import { Avatar, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandGithub,
  IconGlobe,
  IconMessageCode,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full px-1 h-full">
      <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)] bg-white">
        <div className="w-full md:w-7/12 bg-white flex flex-col px-4 pt-4 pb-20 sm:px-6 sm:pt-6 sm:pb-6 relative overflow-y-auto max-h-[calc(100vh-100px)] scrollbar-none [&::-webkit-scrollbar]:hidden">
          <Stack gap="md" className="w-full max-w-2xl">
            <Button
              variant="subtle"
              color="indigo"
              size="sm"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/profile")}
              className="self-start px-0 hover:bg-transparent"
            >
              Back to Profile
            </Button>

            <Title order={2} className="text-gray-800">
              About Chat-Hub
            </Title>

            <Card
              withBorder
              radius="lg"
              p="xl"
              className="border-gray-200 bg-white text-center"
            >
              <Stack align="center" gap="xs">
                <Avatar
                  color="indigo"
                  radius="xl"
                  size={72}
                  className="shadow-md"
                >
                  <IconMessageCode size={36} />
                </Avatar>
                <Title order={3} className="text-gray-800 mt-2">
                  Chat-Hub
                </Title>
                <Text size="sm" c="dimmed">
                  Real-time messaging, group chats, and instant contact
                  collaboration.
                </Text>
                <Text
                  size="xs"
                  fw={600}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full mt-1"
                >
                  Version 1.0.0
                </Text>
              </Stack>
            </Card>

            <Card
              withBorder
              radius="lg"
              p="lg"
              className="border-gray-200 bg-white"
            >
              <Stack gap="md">
                <Group
                  justify="space-between"
                  className="border-b border-gray-100 pb-3"
                >
                  <Group gap="sm">
                    <IconGlobe size={18} className="text-indigo-600" />
                    <Text size="sm" fw={500} className="text-gray-700">
                      Platform
                    </Text>
                  </Group>
                  <Text size="sm" fw={600} className="text-gray-800">
                    Web & Mobile Web
                  </Text>
                </Group>

                <Group
                  justify="space-between"
                  className="border-b border-gray-100 pb-3"
                >
                  <Group gap="sm">
                    <IconBrandGithub size={18} className="text-indigo-600" />
                    <Text size="sm" fw={500} className="text-gray-700">
                      Engine
                    </Text>
                  </Group>
                  <Text size="sm" fw={600} className="text-gray-800">
                    React, Mantine & AWS S3
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Copyright
                  </Text>
                  <Text size="xs" c="dimmed">
                    © 2026 Chat-Hub Inc. All rights reserved.
                  </Text>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </div>
      </div>
    </div>
  );
};

export default About;
