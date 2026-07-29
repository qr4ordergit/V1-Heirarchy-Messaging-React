import { useEffect, useState } from "react";
import {
  Alert,
  //Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
//import { LogOut } from "lucide-react";
import { fetchAccounts, type Account } from "../../api/accountApi";
//mport { COGNITO_LOGOUT_URL } from "../../config/cognito";
import Avatar from "../../component/avatar/Avatar";
import classes from "./Dashboard.module.css";

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  //   const handleLogout = () => {
  //     sessionStorage.clear();
  //     window.location.href = COGNITO_LOGOUT_URL;
  //   };

  return (
    <div className={classes.wrapper}>
      <header className={classes.header}>
        <Container size="lg">
          <Group justify="space-between" py="md">
            <Group gap="sm">
              <div className={classes.brandMark}>H</div>
              <Title order={4} className={classes.brandTitle}>
                Chat-Hub
              </Title>
            </Group>
            {/* <Button
              variant="subtle"
              color="red"
              leftSection={<LogOut size={16} />}
              onClick={handleLogout}
            >
              Logout
            </Button> */}
          </Group>
        </Container>
      </header>

      <Container size="md" py="xl">
        <Group justify="space-between" align="flex-start" mb="md">
          <div>
            <Title order={2} className={classes.title} mb={4}>
              Your Accounts
            </Title>
            <Text c="dimmed" size="sm">
              All accounts under your hub.
            </Text>
          </div>
        </Group>

        {error && (
          <Alert color="red" title="Couldn't load accounts" mb="md">
            {error}
          </Alert>
        )}

        <Card withBorder radius="md" padding={0}>
          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : accounts.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed" size="sm">
                No accounts found.
              </Text>
            </Center>
          ) : (
            <Stack gap={0}>
              {accounts.map((account, i) => (
                <Group
                  key={account.id}
                  gap="sm"
                  wrap="nowrap"
                  className={classes.row}
                  px="md"
                  py="sm"
                >
                  <Avatar name={account.username} colorIndex={i} size={40} />
                  <div>
                    <Text fw={600}>{account.username}</Text>
                    {account.email && (
                      <Text size="xs" c="dimmed">
                        {account.email}
                      </Text>
                    )}
                  </div>
                </Group>
              ))}
            </Stack>
          )}
        </Card>
      </Container>
    </div>
  );
}
