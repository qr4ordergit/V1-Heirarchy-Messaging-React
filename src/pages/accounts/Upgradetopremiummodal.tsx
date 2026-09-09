import { Button, Modal, Stack, Text } from "@mantine/core";
import { IconCrown } from "@tabler/icons-react";

interface UpgradeToPremiumModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function UpgradeToPremiumModal({
  opened,
  onClose,
}: UpgradeToPremiumModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Upgrade to Premium"
      centered
      radius="md"
    >
      <Stack gap="md" align="center" py="sm">
        <IconCrown size={40} color="#f5a623" />
        <Text size="sm" ta="center" c="dimmed">
          Premium plans aren't available yet. We're putting the finishing
          touches on them — check back soon!
        </Text>
        <Button radius="xl" variant="gradient" onClick={onClose}>
          Got it
        </Button>
      </Stack>
    </Modal>
  );
}
