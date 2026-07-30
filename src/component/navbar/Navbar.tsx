import { Container, Group } from "@mantine/core";

function Navbar() {
  return (
    <header>
      <Container size="lg">
        <Group justify="space-between" py="xs">
          <Group gap="sm">
            <div className="text-lg font-bold">Chat-hub</div>
          </Group>
        </Group>
      </Container>
    </header>
  );
}

export default Navbar;
