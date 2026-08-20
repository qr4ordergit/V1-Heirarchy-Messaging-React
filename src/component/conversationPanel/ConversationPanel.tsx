import { useEffect, useState } from "react";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Flex,
  Group,
  Input,
  Loader,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import Heading from "../heading/Heading";
import { IconSearch, IconSwitch3, IconX } from "@tabler/icons-react";
import { useConversationTypeStore } from "../../store/conversation/conversation.type.store";
import DmList from "../dmList/DmList";
import GroupList from "../groupList/GroupList";
import { useNavigate } from "react-router";
import { ROUTES } from "../../router/routes";
import { useAuthStore } from "../../store/auth/auth.store";
import { getAdjacencyListApi } from "../../api/profileApi";
import { notifications } from "@mantine/notifications";
import { fetchAccounts } from "../../api/accountApi";

export default function ConversationPanel() {
  const type = useConversationTypeStore((state) => state.type);
  const setType = useConversationTypeStore((state) => state.setType);
  const search = useConversationTypeStore((state) => state.search);
  const setSearch = useConversationTypeStore((state) => state.setSearch);
  const target_user = useAuthStore((state) => state.target_user);
  const setTargetUser = useAuthStore((state) => state.setTargetUser);
  const userDetails = useAuthStore((state) => state.userDetails);
  const setTargetUserDetails = useAuthStore(
    (state) => state.setTargetUserDetails,
  );

  const [adjacencyList, setAdjacencyList] = useState<string[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const navigate = useNavigate();

  const activeUsername = target_user || userDetails?.username || "";

  const otherAccounts = adjacencyList.filter((acc) => acc !== activeUsername);

  const fetchAdjacencyList = async () => {
    setLoadingAccounts(true);
    try {
      const list = await getAdjacencyListApi();
      setAdjacencyList(list);
    } catch (error: any) {
      notifications.show({
        title: "",
        message: error.message || `Error fetching accounts: ${error}`,
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAdjacencyList();
  }, []);

  const handleCancel = () => {
    setTargetUser("");
    // setTargetUserDetails(null);
    navigate(`/${ROUTES.ACCOUNTS}`);
  };

  const handleSwitchAccount = async (selectedUsername: string) => {
    try {
      const accounts = await fetchAccounts();
      const matchedAccount = accounts.find(
        (acc) =>
          acc.user_id === selectedUsername ||
          acc.display_name === selectedUsername,
      );

      if (matchedAccount) {
        setTargetUserDetails(matchedAccount);
      }
    } catch (error) {
      console.error(error);
    }

    setTargetUser(selectedUsername);
    window.location.reload();
  };

  const conversationTypes = [
    { label: "DM", value: "dm" },
    { label: "Groups", value: "groups" },
  ] as const;

  return (
    <Paper
      radius="md"
      bg="white"
      p={10}
      style={{
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Stack
        gap={15}
        style={{
          height: "100%",
          minHeight: 0,
        }}
      >
        <Flex align={"center"} gap={"xs"} justify={"space-between"}>
          <Heading c="var(--mantine-color-blue-4">Chat Hub</Heading>
          {loadingAccounts ? (
            <Loader size="xs" color="indigo" />
          ) : otherAccounts.length > 0 ? (
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={handleCancel}
                title="Go to accounts"
              >
                <IconX size={12} />
              </ActionIcon>

              <Menu shadow="md" width={220} position="bottom-end" radius="md">
                <Menu.Target>
                  <UnstyledButton className="cursor-pointer">
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs" c="dimmed" fw={500}>
                        {activeUsername}
                      </Text>
                      <ActionIcon
                        size="xs"
                        variant="light"
                        color="indigo"
                        radius="xl"
                      >
                        <IconSwitch3 size={12} />
                      </ActionIcon>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Switch Account</Menu.Label>
                  {otherAccounts.map((accUsername) => {
                    const initials =
                      accUsername
                        .split("-")
                        .map((p) => p[0]?.toUpperCase() || "")
                        .join("")
                        .slice(0, 2) || "U";

                    return (
                      <Menu.Item
                        key={accUsername}
                        onClick={() => handleSwitchAccount(accUsername)}
                        leftSection={
                          <Avatar color="indigo" radius="xl" size={20}>
                            {initials}
                          </Avatar>
                        }
                      >
                        <Text size="xs" fw={500}>
                          {accUsername}
                        </Text>
                      </Menu.Item>
                    );
                  })}
                </Menu.Dropdown>
              </Menu>
            </Group>
          ) : (
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={handleCancel}
                title="Go to accounts"
              >
                <IconX size={12} />
              </ActionIcon>
              <Text size="xs" c={"dimmed"}>
                {activeUsername}
              </Text>
            </Group>
          )}
        </Flex>
        <Input
          size="xs"
          placeholder="Search"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Group gap="xs">
          {conversationTypes.map(({ label, value }) => (
            <Button
              key={value}
              size="compact-xs"
              radius="xl"
              variant={type === value ? "filled" : "outline"}
              onClick={() => {
                navigate(`/${ROUTES.CHATS}`);
                setType(value);
                setSearch("");
              }}
            >
              {label}
            </Button>
          ))}
        </Group>
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
          }}
        >
          <ScrollArea h="100%" offsetScrollbars scrollbarSize={3}>
            {type === "dm" ? <DmList /> : <GroupList />}
          </ScrollArea>
        </Box>
      </Stack>
    </Paper>
  );
}
