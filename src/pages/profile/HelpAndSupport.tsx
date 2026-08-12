import {
  Accordion,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconHeadset,
  IconMail,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";

const HelpAndSupport = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "How do I create a group?",
      a: "Go to the Contacts section, select 'Group List', click on the options menu, and choose 'Create Group'. Select your members, set group admins, and click Save.",
    },
    {
      q: "What is a Pass Key for adding contacts?",
      a: "Some users enable extra privacy requirements. If a contact has passkey protection enabled, you must enter their valid key before sending a contact request.",
    },
    {
      q: "How do I switch between multiple accounts?",
      a: "Open your Profile, tap 'Switch Account' to expand your account list, and select the desired profile.",
    },
  ];

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
              Help & Support
            </Title>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card
                withBorder
                radius="lg"
                p="md"
                className="border-gray-200 bg-white"
              >
                <Group gap="sm">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <IconMail size={20} />
                  </div>
                  <div>
                    <Text size="xs" c="dimmed" fw={500}>
                      Email Support
                    </Text>
                    <Text size="sm" fw={600} className="text-gray-800">
                      support@chathub.com
                    </Text>
                  </div>
                </Group>
              </Card>

              <Card
                withBorder
                radius="lg"
                p="md"
                className="border-gray-200 bg-white"
              >
                <Group gap="sm">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <IconHeadset size={20} />
                  </div>
                  <div>
                    <Text size="xs" c="dimmed" fw={500}>
                      Active Support Hours
                    </Text>
                    <Text size="sm" fw={600} className="text-gray-800">
                      Mon - Fri, 9 AM - 6 PM
                    </Text>
                  </div>
                </Group>
              </Card>
            </div>

            {/* FAQs */}
            <Stack gap="xs" mt="sm">
              <Group gap="xs">
                <IconQuestionMark size={20} className="text-indigo-600" />
                <Text fw={700} size="md" className="text-gray-800">
                  Frequently Asked Questions
                </Text>
              </Group>

              <Card
                withBorder
                radius="lg"
                p="xs"
                className="border-gray-200 bg-white"
              >
                <Accordion variant="separated" radius="md">
                  {faqs.map((faq, index) => (
                    <Accordion.Item key={index} value={`faq-${index}`}>
                      <Accordion.Control className="font-semibold text-gray-800">
                        {faq.q}
                      </Accordion.Control>
                      <Accordion.Panel className="text-sm text-gray-600">
                        {faq.a}
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card>
            </Stack>
          </Stack>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;
