import { Link } from "react-router";
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  List,
  Overlay,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconDeviceMobileOff,
  // IconLock,
  IconEyeOff,
  IconDatabaseOff,
  IconSitemap,
  IconGridDots,
  IconReportSearch,
  IconBuildingStore,
  IconShieldLock,
  IconWorld,
  IconDeviceLaptop,
  IconMessages,
  IconTag,
  IconKey,
} from "@tabler/icons-react";

import classes from "./Home.module.css";
import { ROUTES } from "../../router/routes";
import { COGNITO_LOGIN_URL } from "../../config/cognito";

export default function Home() {
  return (
    <div className={classes.page}>
      <div className={classes.hero}>
        <Overlay
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, .75) 55%)"
          opacity={1}
          zIndex={0}
        />

        <Container size="md" className={classes.heroContent}>
          <Text className={classes.eyebrow}>Messenger for warriors!</Text>
          <Title className={classes.title}>
            All your messenger accounts in one secure Hub. <br />
            {/* <br />
            One secure Hub. */}
          </Title>
          <Text className={classes.description} size="xl" mt="lg">
            Tired of carrying multiple phones? Create all your messenger
            accounts in one Hub — access it from any browser or app, without
            tying your identity to a single device.
          </Text>

          <Group mt="xl">
            <Button
              component={Link}
              to={ROUTES.REGISTER}
              variant="gradient"
              size="xl"
              radius="xl"
              className={classes.control}
            >
              Create Your Hub
            </Button>
            <Button
              component="a"
              href={COGNITO_LOGIN_URL}
              variant="outline"
              color="gray.0"
              size="xl"
              radius="xl"
              className={classes.control}
            >
              Login
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" className={classes.section}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          <Card
            withBorder
            radius="md"
            padding="lg"
            className={classes.featureCard}
          >
            <ThemeIcon
              size={44}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconDeviceMobileOff size={22} />
            </ThemeIcon>
            <Text fw={700} mt="md" mb={4}>
              No Phone or Email Required
            </Text>
            <Text size="sm" c="dimmed">
              Add usernames to your Hub without handing over a phone number or
              email address. Access your data in multiple ways, never tied to
              one device.
            </Text>
          </Card>

          <Card
            withBorder
            radius="md"
            padding="lg"
            className={classes.featureCard}
          >
            <ThemeIcon
              size={44}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconDatabaseOff size={22} />
            </ThemeIcon>
            <Text fw={700} mt="md" mb={4}>
              Your Data Belongs to You
            </Text>
            <Text size="sm" c="dimmed">
              Unlike other messengers, your accounts aren't locked to a specific
              device. You have complete, secure access to your data at all
              times.
            </Text>
          </Card>

          <Card
            withBorder
            radius="md"
            padding="lg"
            className={classes.featureCard}
          >
            <ThemeIcon
              size={44}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconEyeOff size={22} />
            </ThemeIcon>
            <Text fw={700} mt="md" mb={4}>
              Zero Tracking, Real Encryption
            </Text>
            <Text size="sm" c="dimmed">
              Every message is end-to-end encrypted. Zero tracking, zero
              monitoring — and we never sell your data, because we don't have
              access to it.
            </Text>
          </Card>
        </SimpleGrid>
      </Container>

      <div className={classes.altSection}>
        <Container size="lg">
          <Badge variant="light" size="lg" radius="sm" mb="md">
            Paid Service
          </Badge>
          <Title order={2} className={classes.sectionTitle} mb="md">
            Hierarchical Access
          </Title>
          <Text c="dimmed" size="lg" maw={640} mb="xl">
            Create hierarchical accounts and manage them centrally — built for
            companies, sales teams, and families alike.
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            <List spacing="md" size="sm" center>
              <List.Item
                icon={
                  <ThemeIcon radius="xl" size={28} variant="light">
                    <IconSitemap size={16} />
                  </ThemeIcon>
                }
              >
                Companies can create hierarchical accounts for employees,
                monitored centrally from one place.
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon radius="xl" size={28} variant="light">
                    <IconGridDots size={16} />
                  </ThemeIcon>
                }
              >
                Set granular Create/Read/Update/Delete permissions for every
                sub-account using a simple grid.
              </List.Item>
            </List>

            <List spacing="md" size="sm" center>
              <List.Item
                icon={
                  <ThemeIcon radius="xl" size={28} variant="light">
                    <IconReportSearch size={16} />
                  </ThemeIcon>
                }
              >
                Comprehensive search and reporting tools across every account in
                your hierarchy.
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon radius="xl" size={28} variant="light">
                    <IconBuildingStore size={16} />
                  </ThemeIcon>
                }
              >
                Manage sales channels and supply chains — or let parents oversee
                accounts for their children's safety.
              </List.Item>
            </List>
          </SimpleGrid>
        </Container>
      </div>

      <Container size="lg" className={classes.section}>
        <Title order={2} className={classes.sectionTitle} mb="md">
          Secured Digital Identity
        </Title>
        <Text c="dimmed" size="lg" maw={640} mb="xl">
          Access your account from any browser — no app, no install, no risk
          from a lost or stolen device.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          <Stack gap={6} align="flex-start">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconWorld size={20} />
            </ThemeIcon>
            <Text fw={600}>Browser-Only Access</Text>
            <Text size="sm" c="dimmed">
              No app download required — ideal for privacy-conscious people and
              travellers.
            </Text>
          </Stack>

          <Stack gap={6} align="flex-start">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconDeviceLaptop size={20} />
            </ThemeIcon>
            <Text fw={600}>No Device Risk</Text>
            <Text size="sm" c="dimmed">
              Nothing installed on your phone means no risk if it's lost or
              stolen. Just close the browser and clear the cache when done.
            </Text>
          </Stack>

          <Stack gap={6} align="flex-start">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconMessages size={20} />
            </ThemeIcon>
            <Text fw={600}>DMs and Groups</Text>
            <Text size="sm" c="dimmed">
              Both direct messaging and groups are fully supported, side by
              side.
            </Text>
          </Stack>

          <Stack gap={6} align="flex-start">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconTag size={20} />
            </ThemeIcon>
            <Text fw={600}>Tag Your Favorites</Text>
            <Text size="sm" c="dimmed">
              Tag your favorite chats for faster searching and effortless
              archiving.
            </Text>
          </Stack>

          <Stack gap={6} align="flex-start">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconKey size={20} />
            </ThemeIcon>
            <Text fw={600}>Passkey Locking</Text>
            <Text size="sm" c="dimmed">
              Lock your accounts with a passkey to restrict access to only your
              known contacts.
            </Text>
          </Stack>

          <Stack gap={6} align="flex-start">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              className={classes.featureIcon}
            >
              <IconShieldLock size={20} />
            </ThemeIcon>
            <Text fw={600}>And Much More</Text>
            <Text size="sm" c="dimmed">
              This is just the start — your Hub keeps growing with new, secure
              ways to stay connected.
            </Text>
          </Stack>
        </SimpleGrid>
      </Container>

      <div className={classes.ctaSection}>
        <Container size="sm" className={classes.ctaContent}>
          <Title order={2} className={classes.ctaTitle} mb="sm">
            Ready to create your Hub?
          </Title>
          <Text c="dimmed" mb="xl">
            Set up your account in minutes — no phone or email required to get
            started.
          </Text>
          <Group justify="center">
            <Button
              component={Link}
              to={ROUTES.REGISTER}
              variant="gradient"
              size="xl"
              radius="xl"
            >
              Create Your Hub
            </Button>
            <Button
              component="a"
              href={COGNITO_LOGIN_URL}
              variant="default"
              size="xl"
              radius="xl"
            >
              Login
            </Button>
          </Group>
        </Container>
      </div>
    </div>
  );
}
