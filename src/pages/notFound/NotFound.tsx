import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { IconError404 } from "@tabler/icons-react";
import { useNavigate } from "react-router";

import { ROUTES } from "../../router/routes";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Container
      size="md"
      className="flex min-h-screen items-center justify-center"
    >
      <Stack align="center" gap="md">
        <IconError404 size={120} stroke={1.5} className="text-blue-600" />

        <Title order={1}>Page Not Found</Title>

        <Text c="dimmed" ta="center" maw={500}>
          Sorry, the page you are looking for doesn't exist or may have been
          moved.
        </Text>

        <Button onClick={() => navigate(ROUTES.HOME)}>
          Go to Home
        </Button>
      </Stack>
    </Container>
  );
}