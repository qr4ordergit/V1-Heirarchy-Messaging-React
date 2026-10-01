import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  List,
  Menu,
  Overlay,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconDeviceMobileOff,
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
  IconLanguage,
  IconCheck,
  IconPlayerPlayFilled,
  IconX,
  IconUsersGroup,
  IconRobot,
} from "@tabler/icons-react";

import classes from "./Home.module.css";
import { ROUTES } from "../../router/routes";
import { COGNITO_LOGIN_URL } from "../../config/cognito";
import { useTranslation } from "../../store/language/language.store";
import { ManageVideosService } from "../../api/services/manage.videos.service";
import introVideoSrc from "../../assets/intro.mp4";

import logo from "../../assets/logo.png";
const HOME_INTRO_PAGE_NAME = "homepage-intro";

export default function Home() {
  const {
    translation,
    currentLang,
    languages,
    setLanguage,
    isLoaded,
    isLoadingLanguage,
  } = useTranslation();

  const [videoOpen, setVideoOpen] = useState(false);
  const videoOverlayRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [introVideoUrl, setIntroVideoUrl] = useState<string>(introVideoSrc);
  const [introVideoLoading, setIntroVideoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const videos = await ManageVideosService.list(HOME_INTRO_PAGE_NAME);
        const featured = videos
          .filter((v) => v.s3_link)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];

        if (!cancelled && featured?.s3_link) {
          setIntroVideoUrl(featured.s3_link);
        }
      } catch (err) {
        console.error("Could not load homepage intro video:", err);
      } finally {
        if (!cancelled) setIntroVideoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const openIntroVideo = () => setVideoOpen(true);
  const closeIntroVideo = () => setVideoOpen(false);

  useEffect(() => {
    if (!videoOpen) return;

    document.body.style.overflow = "hidden";

    const el = videoOverlayRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeIntroVideo();
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) closeIntroVideo();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [videoOpen]);

  const availableLanguages: [string, string][] = Object.entries(
    languages || {},
  ).filter((entry): entry is [string, string] => typeof entry[1] === "string");

  return (
    <div className={classes.page}>
      <div className={classes.hero} style={{ position: "relative" }}>
        <Overlay
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, .75) 55%)"
          opacity={1}
          zIndex={0}
        />

        <div
          style={{
            position: "absolute",
            top: 18,
            right: 22,
            zIndex: 10,
          }}
        >
          <Menu shadow="md" width={160} position="bottom-end" withinPortal>
            <Menu.Target>
              <Tooltip
                label={translation(
                  "home-page.txtChangeLanguage",
                  "Change Language",
                )}
                position="left"
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="xl"
                  loading={
                    (!isLoaded && availableLanguages.length === 0) ||
                    isLoadingLanguage
                  }
                  aria-label={translation(
                    "home-page.txtSelectLanguage",
                    "Select Language",
                  )}
                  style={{
                    backgroundColor: "rgba(20, 20, 30, 0.45)",
                    color: "#ffffff",
                  }}
                >
                  <IconLanguage size={22} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>
                {translation("home-page.txtSelectLanguage", "Select Language")}
              </Menu.Label>
              {availableLanguages.length > 0 ? (
                availableLanguages.map(([code, label]) => (
                  <Menu.Item
                    key={code}
                    onClick={() => setLanguage(code)}
                    rightSection={
                      currentLang === code ? (
                        <IconCheck
                          size={16}
                          color="var(--mantine-color-indigo-6)"
                        />
                      ) : null
                    }
                    fw={currentLang === code ? 700 : 400}
                  >
                    {label}
                  </Menu.Item>
                ))
              ) : (
                <Menu.Item disabled>
                  {translation(
                    "home-page.txtLoadingLanguages",
                    "Loading languages...",
                  )}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </div>
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 22,
            zIndex: 10,
          }}
        >
          <Group gap="sm" align="center" wrap="nowrap">
            <img src={logo} alt="Ukrchat logo" className={classes.brandLogo} />
            <Text className={classes.brand}>Ukrchat.com</Text>
          </Group>
        </div>
        <Container
          size="md"
          className={classes.heroContent}
          style={{ zIndex: 1 }}
        >
          <Text className={classes.eyebrow}>
            {translation(
              "home-page.txtEyebrowMsg2",
              "Messenger for road warriors!",
            )}
          </Text>
          <Title className={classes.title}>
            {translation(
              "home-page.txtTitleMsg2",
              "All your messenger accounts in one secure hub.",
            )}
          </Title>
          <Text className={classes.description} size="xl" mt="lg">
            {translation(
              "home-page.txtDescriptionMsg2",
              "Tired of carrying multiple phones? Create all your messenger accounts in one hub — access it from any browser or using an app, without tying your account to any specific device.",
            )}
          </Text>

          <Group mt="xl" gap="lg" align="center">
            <Group gap="md" wrap="wrap">
              <Button
                component={Link}
                to={ROUTES.REGISTER}
                variant="gradient"
                size="xl"
                radius="xl"
                className={classes.control}
              >
                {translation("home-page.btnCreateHub", "Create Your Hub")}
              </Button>
              <Button
                component="a"
                href={COGNITO_LOGIN_URL}
                variant="outline"
                color="gray"
                size="xl"
                radius="xl"
                className={classes.control}
                style={{
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.6)",
                }}
              >
                {translation("home-page.btnLogin", "Login")}
              </Button>
            </Group>

            <Group gap={10} align="center" wrap="nowrap">
              <UnstyledButton
                onClick={openIntroVideo}
                className={classes.introVideoBtn}
                aria-label={"Watch intro video"}
                disabled={introVideoLoading}
              >
                <IconPlayerPlayFilled size={16} />
              </UnstyledButton>
              <UnstyledButton
                onClick={openIntroVideo}
                className={classes.introVideoLabel}
              >
                {translation("home-page.txtWatchIntro", "Watch Intro")}
              </UnstyledButton>
            </Group>
          </Group>
        </Container>
      </div>

      {videoOpen && (
        <div
          ref={videoOverlayRef}
          className={classes.videoOverlay}
          onClick={closeIntroVideo}
        >
          <button
            type="button"
            className={classes.videoCloseBtn}
            onClick={(e) => {
              e.stopPropagation();
              closeIntroVideo();
            }}
            aria-label={translation("home-page.ariaCloseVideo", "Close video")}
          >
            <IconX size={22} />
          </button>
          <video
            ref={videoRef}
            className={classes.videoPlayer}
            src={introVideoUrl}
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
          >
            {translation(
              "home-page.txtVideoNotSupported",
              "Your browser does not support embedded videos.",
            )}
          </video>
        </div>
      )}

      <div className={classes.altSection}>
        <Container size="lg">
          <Badge variant="light" size="lg" radius="sm" mb="md">
            {translation("home-page.badgePaidService", "Paid Service")}
          </Badge>
          <Title order={2} className={classes.sectionTitle} mb="md">
            {translation(
              "home-page.txtHierarchicalTitle2",
              "World’s first hierarchical messenger",
            )}
          </Title>
          <Text c="dimmed" size="lg" maw={640} mb="xl">
            {translation(
              "home-page.txtHierarchicalDesc",
              "Create hierarchical accounts and manage them centrally — built for companies, sales teams, and families alike.",
            )}
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
                {translation(
                  "home-page.listItem1",
                  "Companies can create hierarchical accounts for employees, monitored centrally from one place.",
                )}
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon radius="xl" size={28} variant="light">
                    <IconGridDots size={16} />
                  </ThemeIcon>
                }
              >
                {translation(
                  "home-page.listItem2b",
                  "Set granular CRUD (Create/Read/Update/Delete) permissions for every account using a permissions grid.",
                )}
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
                {translation(
                  "home-page.listItem3b",
                  "Comprehensive search and reporting tools available to monitor every account in your hierarchy.",
                )}
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon radius="xl" size={28} variant="light">
                    <IconBuildingStore size={16} />
                  </ThemeIcon>
                }
              >
                {translation(
                  "home-page.listItem4b",
                  "Manage sales channels and supply chains — or let parents oversee accounts for their children's safety.",
                )}
              </List.Item>
            </List>
          </SimpleGrid>
        </Container>
      </div>

      <Container size="lg" className={classes.section}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
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
              <IconUsersGroup size={22} />
            </ThemeIcon>
            <Text fw={700} size="lg" mt="md" mb={6}>
              {translation(
                "home-page.unlimitedTitle",
                "Create unlimited accounts based on usernames or phone numbers",
              )}
            </Text>
            <Text size="sm" c="dimmed" mb="sm">
              {translation(
                "home-page.unlimitedDesc1",
                "You can create an unlimited number of username-based accounts in your hub. You can also create an unlimited number of phone-number-based accounts, as long as you own the phone number and can receive the confirmation one-time password (OTP).",
              )}
            </Text>
            <Text size="sm" c="dimmed">
              {translation(
                "home-page.unlimitedDesc2",
                "Currently, only certain countries (Ukraine, Moldova and Romania) are available for phone-number-based accounts, and any reported abuse will result in account suspension as per applicable laws.",
              )}
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
              <IconRobot size={22} />
            </ThemeIcon>
            <Text fw={700} size="lg" mt="md" mb={6}>
              {translation(
                "home-page.aiTitle",
                "Control AI agents using tags and a categorical keyring",
              )}
            </Text>
            <Text size="sm" c="dimmed" mb="sm">
              {translation(
                "home-page.aiDesc1",
                "Lock individual messages using a passkey to restrict access only to authorized AI agents (bots). This allows you to securely use AI tools (bots) while, at the same time, selectively restricting their access to your message contents.",
              )}
            </Text>
            <Text size="sm" c="dimmed">
              {translation(
                "home-page.aiDesc2",
                "The AI agent can read your tags, but it cannot open and read your messages (when the categorical keyring feature is properly used).",
              )}
            </Text>
          </Card>
        </SimpleGrid>
      </Container>

      <div className={classes.altSection}>
        <Container size="lg">
          <Title order={2} className={classes.sectionTitle} mb="md">
            {translation(
              "home-page.txtSecuredTitle",
              "Secured Digital Identity",
            )}
          </Title>
          <Text c="dimmed" size="lg" maw={640} mb="xl">
            {translation(
              "home-page.txtSecuredDesc2",
              "Optionally, you can access your account from any browser — ideal for soldiers on the front sending messages to their loved ones.",
            )}
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
              <Text fw={600}>
                {translation("home-page.feature1_title2", "Browser Access")}
              </Text>
              <Text size="sm" c="dimmed">
                {translation(
                  "home-page.feature1_desc",
                  "No app download required — ideal for privacy-conscious people and travellers.",
                )}
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
              <Text fw={600}>
                {translation("home-page.feature2_title", "No Device Risk")}
              </Text>
              <Text size="sm" c="dimmed">
                {translation(
                  "home-page.feature2_desc",
                  "Nothing installed on your phone means no risk if it's lost or stolen. Just close the browser and clear the cache when done.",
                )}
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
              <Text fw={600}>
                {translation("home-page.feature3_title", "DMs and Groups")}
              </Text>
              <Text size="sm" c="dimmed">
                {translation(
                  "home-page.feature3_desc",
                  "Both direct messaging and groups are fully supported, side by side.",
                )}
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
              <Text fw={600}>
                {translation("home-page.feature4_title2", "Tag Your Messages")}
              </Text>
              <Text size="sm" c="dimmed">
                {translation(
                  "home-page.feature4_desc2",
                  "Tag your favorite chats for faster searching and effortless archiving. Control AI agents (bots) using tags.",
                )}
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
              <Text fw={600}>
                {translation("home-page.feature5_title", "Passkey Locking")}
              </Text>
              <Text size="sm" c="dimmed">
                {translation(
                  "home-page.feature5_desc",
                  "Lock your accounts with a passkey to restrict access to only your known contacts.",
                )}
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
              <Text fw={600}>
                {translation("home-page.feature6_title", "And Much More")}
              </Text>
              <Text size="sm" c="dimmed">
                {translation(
                  "home-page.feature6_desc2",
                  "This is just the start — your hub keeps growing with new, secure ways to stay connected.",
                )}
              </Text>
            </Stack>
          </SimpleGrid>
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
              {translation(
                "home-page.card1_label2",
                "Communicate without Phone or Email",
              )}
            </Text>
            <Text size="sm" c="dimmed">
              {translation(
                "home-page.card1_desc2",
                "Add usernames to your registered hub account without handing over a phone number or email address. Access your data in multiple ways, never tied to one device.",
              )}
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
              {translation("home-page.card2_label", "Your Data Belongs to You")}
            </Text>
            <Text size="sm" c="dimmed">
              {translation(
                "home-page.card2_desc2",
                "Unlike other messengers, your accounts aren't locked to a specific device. You have complete, secure access to all your data at all times. You can download all your data on a PC at any time.",
              )}
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
              {translation(
                "home-page.card3_label",
                "Zero Tracking, Real Encryption",
              )}
            </Text>
            <Text size="sm" c="dimmed">
              {translation(
                "home-page.card3_desc2",
                "Every message is end-to-end encrypted. Zero tracking, zero monitoring — and we never sell your data, because we don't have access to it. We don’t use sockets to connect to your device to protect your privacy and security.",
              )}
            </Text>
          </Card>
        </SimpleGrid>
      </Container>

      <div className={classes.ctaSection}>
        <Container size="sm" className={classes.ctaContent}>
          <Title order={2} className={classes.ctaTitle} mb="sm">
            {translation(
              "home-page.ctaTitle2",
              "Ready to create your hub account?",
            )}
          </Title>
          <Text c="dimmed" mb="xl">
            {translation(
              "home-page.ctaDesc2",
              "Set up your account instantly.",
            )}
          </Text>
          <Group justify="center">
            <Button
              component={Link}
              to={ROUTES.REGISTER}
              variant="gradient"
              size="xl"
              radius="xl"
              className={classes.control}
            >
              {translation("home-page.btnCreateHub", "Create Your Hub")}
            </Button>
            <Button
              component="a"
              href={COGNITO_LOGIN_URL}
              variant="default"
              size="xl"
              radius="xl"
              className={classes.control}
            >
              {translation("home-page.btnLogin", "Login")}
            </Button>
          </Group>
        </Container>
      </div>
    </div>
  );
}
