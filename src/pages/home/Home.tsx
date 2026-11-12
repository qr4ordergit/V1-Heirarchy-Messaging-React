import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Burger,
  Collapse,
  Drawer,
  Group,
  Menu,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconArrowRight,
  IconBrandAndroid,
  IconBrandApple,
  IconCheck,
  IconLanguage,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";

import classes from "./Home.module.css";
import { ROUTES } from "../../router/routes";
import { COGNITO_LOGIN_URL } from "../../config/cognito";
import { useLogin } from "../../utils/useLogin";
import { useAuthStore } from "../../store/auth/auth.store";
import { useTranslation } from "../../store/language/language.store";
import { ManageVideosService } from "../../api/services/manage.videos.service";
import introVideoSrc from "../../assets/intro.mp4";
import BrandLogo from "../../component/brand/BrandLogo";
import HierarchyStage from "./HierarchyStage";

const HOME_INTRO_PAGE_NAME = "homepage-intro";
const img = (name: string) =>
  new URL(`../../assets/home/${name}`, import.meta.url).href;

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const NAV = [
  { id: "section-about", key: "navAbout", def: "About Project" },
  { id: "section-download", key: "navDownload", def: "Download" },
  { id: "section-security", key: "navSecurity", def: "Security" },
  { id: "section-pricing", key: "navPricing", def: "Pricing" },
  { id: "section-faq", key: "navSupport", def: "Support" },
];

const HERO_SLIDES = [
  {
    image: "hero_business.jpg",
    tag: ["heroTagBusiness", "For Business"],
    text: [
      "heroTextBusiness",
      "Role Hierarchy (CRUD): Management centrally assigns permissions and revokes employee access in one click. Safe AI: Tag-based workflow automation without the risk of leaking trade secrets to AI models.",
    ],
  },
  {
    image: "hero_family.jpg",
    tag: ["heroTagFamily", "For Family"],
    text: [
      "heroTextFamily",
      "Parental Control Without Spying: Parents view and restrict suspicious contacts without invading their child's private messages. Connect From Any Screen: A child can message parents from any computer or tablet if their phone battery dies. Zero Tracking: No ads, trackers, or selling of your family's location or interest data.",
    ],
  },
  {
    image: "hero_military.jpg",
    tag: ["heroTagMilitary", "For Military"],
    text: [
      "heroTextMilitary",
      "Zero-Footprint: Runs in the browser without installation. Close the tab — zero files or cache remain on the phone during inspection. SIM-Free & Socketless Anonymity: Registration without a phone number and communication without a persistent network trace. HQ Protection: If a device is lost, HQ instantly removes the soldier's node from the communication tree.",
    ],
  },
];

const CRUD = [
  [
    "C",
    "Create",
    "Registering a new user profile, creating a new chat room, or sending a new message in a dialogue",
  ],
  [
    "R",
    "Read",
    "Loading message history in a selected chat, viewing active rooms, searching contacts, or opening a peer's profile",
  ],
  [
    "U",
    "Update",
    "Editing an already sent message, updating status ('online' / 'typing...'), or changing an avatar or group title",
  ],
  [
    "D",
    "Delete",
    "Deleting your own message (for yourself or everyone), closing a chat room, or deleting an account",
  ],
];

const ABOUT_VIDEOS = [
  [
    "01",
    "For Managers & Employees",
    "Step-by-step video overview: how to work with client chats through the browser without installing third-party apps on a personal smartphone.",
  ],
  [
    "02",
    "Automation via Semantic Tags",
    "How the isolated Hash (#) AI bot sorts orders and builds reports by tags (#HotLead, #UrgentDeal) without access to the text of your conversations.",
  ],
  [
    "03",
    "Building Department Structure",
    "How to deploy a tree structure of a company or unit in 2 minutes and centrally configure CRUD roles.",
  ],
  [
    "04",
    "Fundamental Principles",
    "Technical overview of Zero Device Footprint, True E2EE, Categorical Keyring and socketless data transfer protocols.",
  ],
];

const STATS = [
  [
    "100%",
    "Secure Connection (HTTPS / WSS)",
    "End-to-end E2EE encryption of every data packet without storing keys on the server",
  ],
  [
    "50,000",
    "Daily Active Users",
    "Corporate hubs, logistics teams, and defense units across Ukraine",
  ],
  [
    "0.01 sec",
    "To Wipe a Dialogue Without Traces",
    "Instant session zeroing in device RAM on command or by closing the browser tab",
  ],
];

const STORES = [
  {
    rating: "4.6",
    reviews: "over 1,000,000 reviews",
    title: "UKRCHAT for Android",
    btn: "Download for Android",
    icon: <IconBrandAndroid size={20} />,
    phone: "phone_android.png",
    cls: "storeA",
  },
  {
    rating: "4.8",
    reviews: "over 500,000 reviews",
    title: "UKRCHAT for iPhone",
    btn: "Download for iPhone",
    icon: <IconBrandApple size={20} />,
    phone: "phone_iphone.png",
    cls: "storeB",
  },
];

const SECURITY_CARDS = [
  [
    "sec_card_1.jpg",
    "Isolated AI",
    "AI helps sort and search, but physically has no access to the text of your conversations.",
  ],
  [
    "sec_card_2.jpg",
    "Socketless Architecture",
    "Protection against network direction finding. Communication leaves no persistent radio-electronic signature.",
  ],
  ["sec_card_3.jpg", "", ""],
];

const SECURITY_PRINCIPLES: [string, string][] = [
  [
    "Client-Grade End-to-End Encryption (True E2EE)",
    "Mathematical guarantee of privacy: only conversation participants hold the keys. The server cannot read messages even if requested.",
  ],
  [
    "Categorical Keyring & Passkey",
    "AI helps sort and search, but physically has zero access to the text of your conversations.",
  ],
  [
    "Anonymous Identity Without SIM Binding",
    "Your digital identity is never tied to a plastic SIM card or passport.",
  ],
  [
    "Instant Hierarchical Offboarding (1-Click Revocation)",
    "Instant access revocation: protect your unit or business assets in a single second.",
  ],
  [
    "Full Data Sovereignty & No-Logs Policy",
    "We don't know who you are, whom you talk to, or what about. Your data belongs solely to you.",
  ],
  [
    "OTP (One-Time Password)",
    "Sign in via One-Time Password (OTP): no permanent passwords to crack or forget. The single-use code verifies login and expires immediately.",
  ],
];

const PARTNERS = [
  "Diia",
  "Luxoptica",
  "Monobank",
  "Nova Poshta",
  "Silpo",
  "DTEK",
  "Ukrainska Pravda",
];

// TODO: replace with values from the pricing API when it is available.
const PRICING = {
  freeAccounts: 4,
  freeStorageGB: 4,
  accountPerDay: 0.03,
  storagePerGBPerDay: 0.025,
  usernamePerDay: 0.03,
  botPerDay: 0.1,
};
const CONTACT_EMAIL = "support@messenger.com";

const PLANS = [
  {
    id: "free",
    name: "Free Usage",
    sub: "Explore our free services",
    price: "0$",
    priceSub: "Free forever",
    cta: "Sign Up",
    tone: "blue",
  },
  {
    id: "paid",
    name: "Paid Usage",
    sub: "Get the comprehensive benefits",
    price: "Pay only for what you use",
    priceSub: "Billed on actual daily usage",
    cta: "Upgrade to Paid",
    tone: "dark",
  },
  {
    id: "custom",
    name: "Custom Pricing",
    sub: "For teams with special needs",
    price: "Negotiable",
    priceSub: "Custom billing for your organization",
    cta: "Contact us",
    tone: "blue",
  },
] as const;

const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

const FAQ = [
  [
    "What does 'Zero-Footprint' mean?",
    "Zero Device Footprint means the messenger runs directly in your browser without installing apps. As soon as you close the browser tab, the session in RAM is immediately zeroed out — leaving zero files, cache, or databases on the device.",
  ],
  [
    "How is UKRchat different from Signal or Telegram?",
    "UKRchat is built around a centralized role hierarchy (CRUD): accounts and client databases belong to the organization, the 'Delete' button can be disabled for staff, no SIM card is required to register, and AI bots are isolated by the Categorical Keyring system.",
  ],
  [
    "Is a SIM card required for registration?",
    "No. Your digital identity in UKRchat is not tied to a plastic SIM card or passport. Work accounts are generated by username and One-Time Password (OTP) in one click.",
  ],
  [
    "How does AI help if messages are encrypted?",
    "Thanks to Categorical Keyring technology, the Hash (#) AI assistant only sees permitted semantic tags (#HotLead, #Urgent, #Payment) to sort chats and build reports, but physically lacks the cryptographic keys to read your message text or view photos.",
  ],
  [
    "What happens when an employee leaves or a phone is lost?",
    "Instant hierarchical offboarding (1-Click Revocation) is triggered: an administrator or HQ revokes node access in one click. The session closes in 0.01 sec, keeping all dialogue history and client records safe.",
  ],
];

const FOOTER_COLS: [string, [string, string][]][] = [
  [
    "Product",
    [
      ["CRUD Hierarchy", "section-hierarchy"],
      ["Zero-Footprint Browser", "section-security"],
      ["Isolated AI (Keyring)", "section-security"],
      ["Team Pricing", "section-pricing"],
    ],
  ],
  [
    "Download",
    [
      ["iOS (App Store)", "section-download"],
      ["Android (Google Play)", "section-download"],
      ["Web Client (No Traces)", "section-security"],
      ["API Documentation", "section-about"],
    ],
  ],
  [
    "Information",
    [
      ["About Project", "section-about"],
      ["FAQ", "section-faq"],
      ["Support", "section-faq"],
    ],
  ],
];

export default function Home() {
  const {
    translation,
    currentLang,
    languages,
    setLanguage,
    isLoaded,
    isLoadingLanguage,
  } = useTranslation();
  const t = (key: string, def: string) => translation(`home-page.${key}`, def);

  const { startLogin, enterWithStoredTokens } = useLogin();
  const hasStoredTokens = useAuthStore(
    (s) => !!s.accessToken && !!s.refreshToken,
  );
  const isMobile = useMediaQuery("(max-width: 62em)");

  useEffect(() => {
    if (hasStoredTokens) void enterWithStoredTokens();
  }, [hasStoredTokens, enterWithStoredTokens]);

  const [introVideoUrl, setIntroVideoUrl] = useState<string>(introVideoSrc);
  const [secOpen, setSecOpen] = useState(false);
  const [video, setVideo] = useState<{ title: string; desc: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const videos = await ManageVideosService.list(HOME_INTRO_PAGE_NAME);
        const featured = videos
          .filter((v) => v.s3_link)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
        if (!cancelled && featured?.s3_link) setIntroVideoUrl(featured.s3_link);
      } catch (err) {
        console.error("Could not load homepage intro video:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const go = (id: string) => {
    setDrawerOpen(false);
    scrollToId(id);
  };

  const N = HERO_SLIDES.length;
  const track = [HERO_SLIDES[N - 1], ...HERO_SLIDES, HERO_SLIDES[0]];
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const active = (pos - 1 + N) % N;

  const next = () => {
    setAnimate(true);
    setPos((p) => p + 1);
  };
  const goTo = (i: number) => {
    setAnimate(true);
    setPos(i + 1);
  };
  const onTrackEnd = () => {
    if (pos === N + 1) {
      setAnimate(false);
      setPos(1);
    } else if (pos === 0) {
      setAnimate(false);
      setPos(N);
    }
  };

  useEffect(() => {
    if (pos >= 1 && pos <= N) return;
    const id = window.setTimeout(() => {
      setAnimate(false);
      setPos(((((pos - 1) % N) + N) % N) + 1);
    }, 800);
    return () => window.clearTimeout(id);
  }, [pos, N]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setPos((p) => {
        if (p >= 1 && p <= N) return p;
        setAnimate(false);
        return ((((p - 1) % N) + N) % N) + 1;
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [N]);
  useEffect(() => {
    const timer = window.setInterval(next, 7000);
    return () => window.clearInterval(timer);
  }, [pos]);

  const unitDay = translation("account_billing.unitDay", "day");
  const rate = (n: number) => n.toFixed(4);
  const bt = (key: string, def: string) =>
    translation(`account_billing.${key}`, def);

  const freeFeatures = (): string[] => [
    fill(t("plan_free_accounts", "First {free} chat accounts free"), {
      free: PRICING.freeAccounts,
    }),
    fill(t("plan_free_storage", "{free} GB storage free"), {
      free: PRICING.freeStorageGB,
    }),
    bt("featBulkAccountsTitle", "Bulk account creation"),
    bt("featHierarchicalAccessTitle", "Hierarchical Account Access"),
    bt("featOneOnOneTitle", "One on One Chat - (Encrypted)"),
    bt("featGroupChatsTitle", "Group Chats - (Encrypted)"),
    bt("featDoubleEncryptionTitle", "Double Encryption with own password"),
    bt("featScheduledMsgsTitle", "Scheduled Messages"),
    bt("featDisappearingMsgsTitle", "Disappearing Messages"),
    bt("featAccountTagsTitle", "Account & Group Tags"),
    bt("featExportChatsTitle", "Export/Download Chats with Media"),
  ];

  const paidFeatures = (): string[] => [
    fill(
      bt(
        "featChatAccountsDesc",
        "First {free} accounts are free (Beyond {free} free accounts, ${price} per account per {unit})",
      ),
      {
        free: PRICING.freeAccounts,
        price: rate(PRICING.accountPerDay),
        unit: unitDay,
      },
    ),
    fill(
      t(
        "plan_paid_premiumUsernames",
        "Premium usernames (${price} per username per {unit})",
      ),
      { price: rate(PRICING.usernamePerDay), unit: unitDay },
    ),
    fill(t("plan_paid_bot", "BOT account (${price} per account per {unit})"), {
      price: String(PRICING.botPerDay),
      unit: unitDay,
    }),
    fill(
      bt(
        "featStorageDesc",
        "Up to {free} storage free (Beyond {free}, ${price} per GB per {unit})",
      ),
      {
        free: `${PRICING.freeStorageGB} GB`,
        price: rate(PRICING.storagePerGBPerDay),
        unit: unitDay,
      },
    ),
    `${bt("featCloudCostTitle", "Cloud computing cost")}: ${bt(
      "featCloudCostDesc",
      "Will be based on your actual daily usage",
    )}`,
  ];

  const customFeatures = (): string[] => [
    t("plan_custom_feature1", "Custom, negotiable billing arrangements"),
    t("plan_custom_feature2", "Support for large teams and organizations"),
    t("plan_custom_feature3", "Talk directly with us"),
  ];

  const featuresOf = (id: string): string[] =>
    id === "free"
      ? freeFeatures()
      : id === "paid"
        ? paidFeatures()
        : customFeatures();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [hierActive, setHierActive] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-reveal]");
    if (!els) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(classes.visible);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const availableLanguages: [string, string][] = Object.entries(
    languages || {},
  ).filter((entry): entry is [string, string] => typeof entry[1] === "string");

  const reveal = { "data-reveal": true, className: classes.reveal } as const;

  return (
    <div
      className={`${classes.page} ${hierActive ? classes.hierBlur : ""}`}
      ref={rootRef}
    >
      <header className={classes.header}>
        <div className={classes.headerInner}>
          <UnstyledButton
            className={classes.logoBtn}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="UKRCHAT"
          >
            <BrandLogo size={26} className={classes.logoIcon} />
            <span className={classes.logoText}>UKRCHAT</span>
          </UnstyledButton>

          {!isMobile && (
            <nav className={classes.nav}>
              {NAV.map((n) => (
                <UnstyledButton
                  key={n.id}
                  className={classes.navLink}
                  onClick={() => go(n.id)}
                >
                  {t(n.key, n.def)}
                </UnstyledButton>
              ))}
            </nav>
          )}

          <Group gap="xs" wrap="nowrap">
            <Menu shadow="md" width={160} position="bottom-end" withinPortal>
              <Menu.Target>
                <Tooltip
                  label={t("txtChangeLanguage", "Change Language")}
                  position="bottom"
                  withArrow
                >
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    radius="xl"
                    className={classes.headerIcon}
                    loading={
                      (!isLoaded && availableLanguages.length === 0) ||
                      isLoadingLanguage
                    }
                    aria-label={t("txtSelectLanguage", "Select Language")}
                  >
                    <IconLanguage size={20} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  {t("txtSelectLanguage", "Select Language")}
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
                    {t("txtLoadingLanguages", "Loading languages...")}
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>

            <a
              href={COGNITO_LOGIN_URL}
              onClick={startLogin}
              className={classes.loginBtn}
            >
              {t("btnLogin", "Login")}
            </a>

            {isMobile && (
              <Burger
                opened={drawerOpen}
                onClick={() => setDrawerOpen((o) => !o)}
                color="white"
                size="sm"
                aria-label={t("navMenu", "Menu")}
              />
            )}
          </Group>
        </div>
      </header>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="right"
        size="xs"
        title="UKRCHAT"
        zIndex={400}
      >
        <Stack gap="xs">
          {NAV.map((n) => (
            <UnstyledButton
              key={n.id}
              className={classes.drawerLink}
              onClick={() => go(n.id)}
            >
              {t(n.key, n.def)}
            </UnstyledButton>
          ))}
        </Stack>
      </Drawer>

      <main>
        <section
          className={`${classes.hero} ${classes.blurTarget}`}
          onClick={next}
          title={t("heroSwitchHint", "Click the picture to switch slide")}
        >
          <div className={classes.heroFrame}>
            <div
              className={classes.heroTrack}
              style={{
                transform: `translateX(-${pos * 100}%)`,
                transition: animate
                  ? "transform 0.72s cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",
              }}
              onTransitionEnd={onTrackEnd}
            >
              {track.map((s, i) => (
                <div
                  key={i}
                  className={classes.heroSlide}
                  aria-hidden={i !== pos}
                >
                  <img src={img(s.image)} alt="" className={classes.heroImg} />
                  <div className={classes.heroBlur} />
                  <div className={classes.heroGrad} />
                  <div className={classes.heroCopy}>
                    <div className={classes.heroCopyInner}>
                      <div className={classes.heroTag}>
                        {t(s.tag[0], s.tag[1])}
                      </div>
                      <h1 className={classes.heroTitle}>
                        {t(
                          "heroTitle",
                          "The world's first hierarchical messenger",
                        )}
                      </h1>
                      <p className={classes.heroDesc}>
                        {t(s.text[0], s.text[1])}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={classes.dots} onClick={(e) => e.stopPropagation()}>
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.image}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={`${classes.dot} ${i === active ? classes.dotActive : ""}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </div>
        </section>

        <div className={classes.darkWrap}>
          <section id="section-hierarchy" className={classes.hierarchy}>
            <div
              {...reveal}
              className={`${classes.reveal} ${classes.blurTarget}`}
              style={{
                textAlign: "center",
                maxWidth: 760,
                margin: "0 auto 40px",
              }}
            >
              <Title order={2} className={classes.h2}>
                {t("hierarchyTitle", "How the Hierarchy Works")}
              </Title>
              <Text className={classes.lead}>
                {t(
                  "hierarchyText",
                  "Instead of chaotic chats where every participant is their own admin, the system builds a clear vertical of access keys. Channels belong to the organization, while employees receive only temporary permissions to work with them.",
                )}
              </Text>
            </div>

            <HierarchyStage onActiveChange={setHierActive} />
          </section>

          <div className={`${classes.watermarkWrap} ${classes.blurTarget}`}>
            <div className={classes.watermark}>
              <BrandLogo size={960} />
            </div>

            <section id="section-crud" className={classes.narrow}>
              <p
                {...reveal}
                className={`${classes.reveal} ${classes.crudLead}`}
              >
                {t(
                  "crudLead",
                  "By combining these four operations, you have complete control over your profile and communication history on the platform.",
                )}
              </p>
              <div className={classes.crudGrid}>
                {CRUD.map(([letter, title, text], i) => (
                  <div
                    key={letter}
                    data-reveal
                    style={{ transitionDelay: `${i * 90}ms` }}
                    className={`${classes.reveal} ${classes.crudCard}`}
                  >
                    <div className={classes.crudLetter}>{letter}</div>
                    <div className={classes.crudDivider} />
                    <h3 className={classes.crudTitle}>
                      {t(`crud${i + 1}Title`, title)}
                    </h3>
                    <p className={classes.crudText}>
                      {t(`crud${i + 1}Text`, text)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="section-about"
              className={classes.narrow}
              style={{ paddingTop: 80, paddingBottom: 80 }}
            >
              <div
                {...reveal}
                className={`${classes.reveal} ${classes.aboutGrid}`}
              >
                <div>
                  <h2 className={classes.h2Left}>
                    {t(
                      "aboutTitle",
                      "Everything You Need to Know About the Project",
                    )}
                  </h2>
                  <p className={classes.aboutText}>
                    {t(
                      "aboutText",
                      "A complete breakdown of security architecture, access permissions, and a step-by-step guide for administrators and teams.",
                    )}
                  </p>
                  <button
                    type="button"
                    className={classes.outlineBtn}
                    onClick={() => scrollToId("section-security")}
                  >
                    {t("btnAboutMore", "More About the Project")}
                  </button>
                </div>
                <div className={classes.videoList}>
                  {ABOUT_VIDEOS.map(([n, title0, desc0], vi) => {
                    const title = t(`aboutVideo${vi + 1}Title`, title0);
                    const desc = t(`aboutVideo${vi + 1}Desc`, desc0);
                    return (
                      <button
                        key={n}
                        type="button"
                        className={classes.videoLink}
                        onClick={() =>
                          setVideo({ title: `${n}. ${title}`, desc })
                        }
                      >
                        <span className={classes.videoLinkLeft}>
                          <span className={classes.videoNum}>{n}</span>
                          <span className={classes.videoTitle}>{title}</span>
                        </span>
                        <span className={classes.videoPlay}>
                          <IconChevronRight size={16} stroke={2} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={classes.statGrid}>
                {STATS.map(([value, label, text], i) => (
                  <div
                    key={label}
                    data-reveal
                    style={{ transitionDelay: `${i * 90}ms` }}
                    className={`${classes.reveal} ${classes.statCard}`}
                  >
                    <div className={classes.statValue}>
                      {value.endsWith(" sec") ? (
                        <>
                          {value.slice(0, -4)}{" "}
                          <span className={classes.statUnit}>
                            {t("statSecUnit", "sec")}
                          </span>
                        </>
                      ) : (
                        value
                      )}
                    </div>
                    <div className={classes.statLabel}>
                      {t(`stat${i + 1}Label`, label)}
                    </div>
                    <p className={classes.statText}>
                      {t(`stat${i + 1}Text`, text)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section
            id="section-download"
            className={`${classes.narrow} ${classes.blurTarget}`}
            style={{ paddingTop: 64, paddingBottom: 112 }}
          >
            <h2 {...reveal} className={`${classes.reveal} ${classes.h2Center}`}>
              {t("downloadTitle", "Use the App on Your Preferred Platform")}
            </h2>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={32} {...reveal}>
              {STORES.map((c, si) => (
                <div
                  key={c.title}
                  className={`${classes.storeCard} ${classes[c.cls]}`}
                >
                  <div className={classes.storeTop}>
                    <div>
                      <div className={classes.rating}>
                        <span>{c.rating}</span>
                        <span className={classes.stars}>★★★★★</span>
                        <span className={classes.reviews}>
                          • {t(`store${si + 1}Reviews`, c.reviews)}
                        </span>
                      </div>
                      <h3 className={classes.storeTitle}>
                        {t(`store${si + 1}Title`, c.title)}
                      </h3>
                    </div>
                    <button type="button" className={classes.storeBtn}>
                      {c.icon}
                      <span>{t(`store${si + 1}Btn`, c.btn)}</span>
                    </button>
                  </div>
                  <div className={classes.phoneWrap}>
                    <img
                      src={img(c.phone)}
                      alt={c.title}
                      className={classes.phone}
                    />
                  </div>
                </div>
              ))}
            </SimpleGrid>
          </section>
        </div>

        <div className={`${classes.lightWrap} ${classes.blurTarget}`}>
          <section id="section-security" className={classes.lightNarrow}>
            <div
              {...reveal}
              className={`${classes.reveal} ${classes.lightHead}`}
            >
              <h2 className={classes.h2Dark}>
                {t("securityTitle", "UKRCHAT Security")}
              </h2>
              <p className={classes.subDark}>
                {t(
                  "securitySub",
                  "Your communication. Your security. Your rules.",
                )}
              </p>
            </div>

            <div
              {...reveal}
              className={`${classes.reveal} ${classes.bentoWide}`}
            >
              <div className={classes.bentoImgWrap}>
                <img
                  src={img("sec_top_laptop.jpg")}
                  alt={t("secZeroTitle", "Zero Device Footprint")}
                  className={classes.bentoImg}
                />
                <div className={classes.bentoFade} />
                <button
                  type="button"
                  className={classes.morePill}
                  onClick={() => setSecOpen(true)}
                >
                  {t("btnMore", "More")}
                </button>
              </div>
              <div className={classes.bentoBody}>
                <div style={{ margin: "auto 0" }}>
                  <h3 className={classes.bentoTitle}>
                    {t("secZeroTitle", "Zero Device Footprint")}
                  </h3>
                  <p className={classes.bentoText}>
                    {t(
                      "secZeroText",
                      "Close the browser — your device is completely clean. No files, databases, or system traces left behind.",
                    )}
                  </p>
                </div>
                <div style={{ textAlign: "right", marginTop: 24 }}>
                  <button
                    type="button"
                    className={classes.learnMore}
                    onClick={() => scrollToId("section-faq")}
                  >
                    <span>{t("btnLearnMore", "Learn More")}</span>
                    <IconArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div
              {...reveal}
              className={`${classes.reveal} ${classes.bentoRow}`}
            >
              {SECURITY_CARDS.map(([image, title0, text0], ci) => {
                const title = title0 ? t(`secCard${ci + 1}Title`, title0) : "";
                const text = text0 ? t(`secCard${ci + 1}Text`, text0) : "";
                return (
                  <div
                    key={image}
                    className={classes.bentoCard}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSecOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSecOpen(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={classes.bentoCardImgWrap}>
                      <img
                        src={img(image)}
                        alt={title}
                        className={classes.bentoCardImg}
                      />
                      <span className={classes.morePill}>
                        {t("btnMore", "More")}
                      </span>
                    </div>
                    {text && (
                      <div className={classes.bentoCardBody}>
                        <h4>{title}</h4>
                        <p>{text}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section
            id="section-trust"
            style={{ padding: "32px 0", marginBottom: 64, overflow: "hidden" }}
          >
            <div
              {...reveal}
              className={`${classes.reveal} ${classes.lightHead}`}
              style={{ textAlign: "center" }}
            >
              <h2 className={`${classes.h2Dark} ${classes.h2Trust}`}>
                {t("trustTitle", "Trusted By")}
              </h2>
              <p className={classes.subDark}>
                {t("trustSub", "Leaders of the Ukrainian market")}
              </p>
            </div>
            <div className={classes.marquee}>
              <div className={classes.marqueeTrack}>
                {[0, 1].map((set) => (
                  <div
                    key={set}
                    className={classes.marqueeSet}
                    aria-hidden={set === 1}
                  >
                    {PARTNERS.map((name, i) => (
                      <img
                        key={name}
                        src={img(`partner_${i}.png`)}
                        alt={set === 0 ? name : ""}
                        className={classes.partner}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="section-pricing"
            className={classes.lightNarrow}
            style={{ maxWidth: 1020, paddingBottom: 24 }}
          >
            <div
              {...reveal}
              className={`${classes.reveal} ${classes.pricingHead}`}
            >
              <h2 className={classes.h2Dark}>
                {t("pricingTitle", "Create Your Hub for Free")}
              </h2>
            </div>

            <div
              {...reveal}
              className={`${classes.reveal} ${classes.planGrid}`}
            >
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`${classes.plan} ${p.tone === "dark" ? classes.planDark : classes.planBlue}`}
                >
                  <div>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                      <h3 className={classes.planName}>
                        {t(`plan_${p.id}_name`, p.name)}
                      </h3>
                      <p className={classes.planSub}>
                        {t(`plan_${p.id}_sub`, p.sub)}
                      </p>
                    </div>
                    <div className={classes.priceBox}>
                      <span className={classes.planPrice}>
                        {t(`plan_${p.id}_price`, p.price)}
                      </span>
                      <span className={classes.planPriceSub}>
                        {t(`plan_${p.id}_priceSub`, p.priceSub)}
                      </span>
                    </div>
                    {p.id === "custom" ? (
                      <a
                        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                          t("plan_contact_subject", "Custom billing inquiry"),
                        )}`}
                        className={classes.planBtn}
                      >
                        {t(`plan_${p.id}_cta`, p.cta)}
                      </a>
                    ) : (
                      <Link to={ROUTES.REGISTER} className={classes.planBtn}>
                        {t(`plan_${p.id}_cta`, p.cta)}
                      </Link>
                    )}
                    <div className={classes.planList}>
                      <div className={classes.planListTitle}>
                        {t("planIncluded", "What's included:")}
                      </div>
                      {featuresOf(p.id).map((f) => (
                        <div key={f} className={classes.planItem}>
                          <span>✓</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={`${classes.darkBottom} ${classes.blurTarget}`}>
          <section id="section-faq" className={classes.faq}>
            <h2 {...reveal} className={`${classes.reveal} ${classes.h2Center}`}>
              {t("faqTitle", "Frequently Asked Questions")}
            </h2>
            <div {...reveal} className={`${classes.reveal} ${classes.faqList}`}>
              {FAQ.map(([q, a], i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={q}
                    className={`${classes.faqItem} ${open ? classes.faqOpen : ""}`}
                  >
                    <button
                      type="button"
                      className={classes.faqBtn}
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span className={classes.faqQ}>
                        {t(`faq${i + 1}Q`, q)}
                      </span>
                      <span className={classes.faqIcon}>+</span>
                    </button>
                    <Collapse expanded={open}>
                      <div className={classes.faqA}>{t(`faq${i + 1}A`, a)}</div>
                    </Collapse>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="section-cta" className={classes.ctaWrap}>
            <div {...reveal} className={`${classes.reveal} ${classes.cta}`}>
              <h2 className={classes.ctaTitle}>
                {t("ctaTitle1", "Ready to Create Your Own")}
                <br />
                {t("ctaTitle2", "Secure Hub?")}
              </h2>
              <p className={classes.ctaText}>
                {t(
                  "ctaText1",
                  "Deploy your company's tree structure in 2 minutes.",
                )}
                <br />
                {t(
                  "ctaText2",
                  "The free plan is available immediately after registration.",
                )}
              </p>
              <Link to={ROUTES.REGISTER} className={classes.ctaBtn}>
                {t("btnCreateHub", "Create Your Hub")}
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className={`${classes.footer} ${classes.blurTarget}`}>
        <div className={classes.footerLine} />
        <div className={classes.footerInner}>
          <div className={classes.footerGrid}>
            <div>
              <button
                type="button"
                className={classes.footerLogo}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <BrandLogo size={28} />
                <span>UKRCHAT</span>
              </button>
              <p className={classes.footerAbout}>
                {t(
                  "footerAbout",
                  "The world's first hierarchical messenger with a CRUD permission matrix and Zero Device Footprint technology for business, government structures, and Ukraine's defenders.",
                )}
              </p>
            </div>
            {FOOTER_COLS.map(([title, links], fci) => (
              <Stack key={title} gap={10} align="flex-start">
                <div className={classes.footerHead}>
                  {t(`footerCol${fci + 1}Title`, title)}
                </div>
                {links.map(([label, target], li) => (
                  <UnstyledButton
                    key={label}
                    className={classes.footerLink}
                    onClick={() => scrollToId(target)}
                  >
                    {t(`footerCol${fci + 1}Link${li + 1}`, label)}
                  </UnstyledButton>
                ))}
                {title === "Information" && (
                  <a
                    href={COGNITO_LOGIN_URL}
                    onClick={startLogin}
                    className={classes.footerLink}
                  >
                    {t("footerPersonalAccount", "Personal Account")}
                  </a>
                )}
              </Stack>
            ))}
          </div>
          <div className={classes.footerBottom}>
            <span>
              {t("footerRights", "© 2026 UKRCHAT. All rights reserved.")}
            </span>
            <Group gap="lg">
              <Link to={`/${ROUTES.PRIVACY}`} className={classes.footerLink}>
                {t("footerPrivacy", "Privacy Policy")}
              </Link>
              <UnstyledButton
                className={classes.footerLink}
                onClick={() => scrollToId("section-about")}
              >
                {t("footerTerms", "Terms of Use")}
              </UnstyledButton>
            </Group>
          </div>
        </div>
      </footer>

      <Modal
        opened={secOpen}
        onClose={() => setSecOpen(false)}
        size="lg"
        centered
        title={t("securityTitle", "UKRCHAT Security")}
        closeButtonProps={{ icon: <IconX size={18} /> }}
      >
        <Stack gap="md">
          <Text fw={700}>
            {t("secPrinciplesTitle", "Fundamental Data Protection Principles")}
          </Text>
          {SECURITY_PRINCIPLES.map(([title, text], pi) => (
            <div key={title}>
              <Text fw={700}>{t(`secPrinciple${pi + 1}Title`, title)}</Text>
              <Text size="sm" c="dimmed">
                {t(`secPrinciple${pi + 1}Text`, text)}
              </Text>
            </div>
          ))}
        </Stack>
      </Modal>

      <Modal
        opened={video !== null}
        onClose={() => setVideo(null)}
        size="xl"
        centered
        title={video?.title}
        closeButtonProps={{ icon: <IconX size={18} /> }}
      >
        {video && (
          <Stack gap="sm">
            <video
              src={introVideoUrl}
              controls
              autoPlay
              playsInline
              style={{ width: "100%", borderRadius: 12, background: "#000" }}
            />
            {video.desc && (
              <Text size="sm" c="dimmed">
                {video.desc}
              </Text>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  );
}
