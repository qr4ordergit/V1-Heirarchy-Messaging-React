import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconArrowLeft,
  IconEye,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";

const Privacy = () => {
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
              Privacy Policy
            </Title>

            <Stack gap="sm">
              <Card
                withBorder
                radius="lg"
                p="lg"
                className="border-gray-200 bg-white shadow-xs"
              >
                <Group gap="md" align="flex-start">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <IconLock size={22} />
                  </div>
                  <div className="flex-1">
                    <Text fw={600} size="md" className="text-gray-800">
                      End-to-End Encryption
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      Your messages, calls, and shared media are protected with
                      strong encryption. No unauthorized third parties can
                      access your conversations.
                    </Text>
                  </div>
                </Group>
              </Card>

              <Card
                withBorder
                radius="lg"
                p="lg"
                className="border-gray-200 bg-white shadow-xs"
              >
                <Group gap="md" align="flex-start">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <IconEye size={22} />
                  </div>
                  <div className="flex-1">
                    <Text fw={600} size="md" className="text-gray-800">
                      Profile & Visibility Controls
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      You control who sees your online status, profile picture,
                      and activity logs. Manage your visibility settings
                      anytime.
                    </Text>
                  </div>
                </Group>
              </Card>

              <Card
                withBorder
                radius="lg"
                p="lg"
                className="border-gray-200 bg-white shadow-xs"
              >
                <Group gap="md" align="flex-start">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <IconShieldCheck size={22} />
                  </div>
                  <div className="flex-1">
                    <Text fw={600} size="md" className="text-gray-800">
                      Data Security & Storage
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      We do not sell or rent your personal data to advertisers.
                      Your credentials and auth tokens are safely hashed and
                      stored using industry-standard protocols.
                    </Text>
                  </div>
                </Group>
              </Card>
            </Stack>
          </Stack>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
