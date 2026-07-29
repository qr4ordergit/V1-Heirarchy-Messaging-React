import { Container, Group, Title } from "@mantine/core";

function Navbar() {
  return (
    <header>
      <Container size="lg">
        <Group justify="space-between" py="xs">
          <Group gap="sm">
            <Title order={4}>Chat-Hub</Title>
          </Group>
        </Group>
      </Container>
    </header>
  );
}

export default Navbar;
