import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Group,
  Menu,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconLanguage } from "@tabler/icons-react";

import { signup, verifyOtp } from "../../api/authApi";
import { COGNITO_LOGIN_URL } from "../../config/cognito";
import HubOrbit from "../../component/hubOrbit/HubOrbit";
import { useTranslation } from "../../store/language/language.store";
import logo from "../../assets/logo.png";
import classes from "./Signup.module.css";

const GROUP_NAME = "Hub";

interface SignupFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

type Step = "signup" | "verify";

export default function Signup() {
  const {
    translation,
    currentLang,
    languages,
    setLanguage,
    isLoaded,
    isLoadingLanguage,
  } = useTranslation();

  const [step, setStep] = useState<Step>("signup");
  const [values, setValues] = useState<SignupFormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const availableLanguages: [string, string][] = Object.entries(
    languages || {},
  ).filter((entry): entry is [string, string] => typeof entry[1] === "string");

  const handleChange =
    (field: keyof SignupFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ?? "";
      setValues((prev) => ({ ...prev, [field]: value }));
    };

  const validate = (): boolean => {
    const newErrors: SignupFormErrors = {};

    if (!values.email.trim()) {
      newErrors.email = translation(
        "signup.errEmailRequired",
        "Email is required",
      );
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      newErrors.email = translation(
        "signup.errEmailInvalid",
        "Enter a valid email",
      );
    }

    if (!values.password) {
      newErrors.password = translation(
        "signup.errPasswordRequired",
        "Password is required",
      );
    } else if (values.password.length < 8) {
      newErrors.password = translation(
        "signup.errPasswordMinLength",
        "Password must be at least 8 characters",
      );
    }

    if (values.confirmPassword !== values.password) {
      newErrors.confirmPassword = translation(
        "signup.errPasswordMismatch",
        "Passwords do not match",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setInfoMessage(null);

    if (!validate()) return;

    try {
      setSubmitting(true);
      const response = await signup({
        email: values.email.trim(),
        password: values.password,
        group_name: GROUP_NAME,
      });

      setInfoMessage(
        `${response.message} ${translation("signup.txtToYourEmail", "to your email")} ${values.email}.`,
      );
      //ssetInfoMessage(`Otp has been sent to your email`);
      setStep("verify");
      // window.location.href = COGNITO_LOGIN_URL;
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : translation(
              "signup.errSignupFailedGeneric",
              "Signup failed. Please try again.",
            ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setOtpError(null);

    if (otp.length < 6) {
      setOtpError(
        translation(
          "signup.errOtpRequired",
          "Enter the 6-digit code sent to your email",
        ),
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await verifyOtp({ email: values.email.trim(), otp });

      if (response.success) {
        window.location.href = COGNITO_LOGIN_URL;
      } else {
        setOtpError(
          response.message ||
            translation(
              "signup.errVerificationFailedGeneric",
              "Verification failed. Please try again.",
            ),
        );
      }
    } catch (err) {
      setOtpError(
        err instanceof Error
          ? err.message
          : translation(
              "signup.errVerificationFailedGeneric",
              "Verification failed. Please try again.",
            ),
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className={classes.wrapper}>
      <div className={classes.langWrap}>
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
                  backgroundColor: "rgba(20, 20, 30, 0.55)",
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

      <aside className={classes.showcase}>
        <div className={classes.brandWrap}>
          <Group gap="sm" align="center" wrap="nowrap">
            <img src={logo} alt="Ukrchat logo" className={classes.brandLogo} />
            <Text className={classes.brand}>Ukrchat.com</Text>
          </Group>
        </div>

        <div className={classes.showcaseBody}>
          <div className={classes.orbitBox}>
            <HubOrbit />
          </div>
          <Title order={1} className={classes.showcaseTitle}>
            {translation(
              "signup.showcaseTitle",
              "All your messenger accounts in one secure hub.",
            )}
          </Title>
        </div>
      </aside>

      <Paper radius={0} className={classes.panel}>
        <Title order={2} className={classes.title} mb={8}>
          {step === "signup"
            ? translation("signup.titleCreateHub", "Create Your Hub")
            : translation("signup.titleVerifyEmail", "Verify your email")}
        </Title>

        {step === "signup" ? (
          <Text c="dimmed" size="sm" mb="lg">
            {translation(
              "signup.txtSignupSubtitle",
              "This will be your main account. You can create multiple sub accounts with username, email or phone number.",
            )}
          </Text>
        ) : (
          <Text c="dimmed" size="sm" mb="lg">
            {translation("signup.txtSentCodeTo", "We sent a code to")}{" "}
            <strong>{values.email}</strong>
          </Text>
        )}

        {step === "signup" ? (
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              {apiError && (
                <Alert
                  color="red"
                  title={translation(
                    "signup.alertSignupFailedTitle",
                    "Signup failed",
                  )}
                >
                  {apiError}
                </Alert>
              )}

              <TextInput
                label={translation("signup.labelEmail", "Email")}
                classNames={{ label: classes.fieldLabel }}
                placeholder={translation(
                  "signup.placeholderEmail",
                  "you@example.com",
                )}
                value={values.email}
                onChange={handleChange("email")}
                error={errors.email}
                size="md"
                required
              />
              <PasswordInput
                label={translation("signup.labelPassword", "Password")}
                classNames={{ label: classes.fieldLabel }}
                placeholder={translation(
                  "signup.placeholderPassword",
                  "Your password",
                )}
                value={values.password}
                onChange={handleChange("password")}
                error={errors.password}
                size="md"
                required
              />
              <PasswordInput
                label={translation(
                  "signup.labelConfirmPassword",
                  "Confirm password",
                )}
                classNames={{ label: classes.fieldLabel }}
                placeholder={translation(
                  "signup.placeholderConfirmPassword",
                  "Confirm your password",
                )}
                value={values.confirmPassword}
                onChange={handleChange("confirmPassword")}
                error={errors.confirmPassword}
                size="md"
                required
              />

              <Button
                type="submit"
                fullWidth
                size="md"
                mt="xs"
                radius="xl"
                variant="gradient"
                loading={submitting}
              >
                {translation("signup.btnCreateAccount", "Create Account")}
              </Button>

              <Text ta="center" c="dimmed" size="sm">
                {translation(
                  "signup.txtAlreadyHaveAccount",
                  "Already have an account?",
                )}{" "}
                <Anchor href={COGNITO_LOGIN_URL} size="sm" fw={600}>
                  {translation("signup.btnLogin", "Login")}
                </Anchor>
              </Text>
            </Stack>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate>
            <Stack gap="md" align="center">
              {infoMessage && (
                <Alert
                  color="blue"
                  title={translation(
                    "signup.alertCheckInboxTitle",
                    "Check your inbox",
                  )}
                  w="100%"
                >
                  {infoMessage}
                </Alert>
              )}
              {otpError && (
                <Alert
                  color="red"
                  title={translation(
                    "signup.alertVerificationFailedTitle",
                    "Verification failed",
                  )}
                  w="100%"
                >
                  {otpError}
                </Alert>
              )}

              <PinInput
                length={6}
                value={otp}
                onChange={setOtp}
                type="number"
              />

              <Button
                type="submit"
                fullWidth
                mt="md"
                radius="xl"
                variant="gradient"
                loading={submitting}
              >
                {translation("signup.btnVerifyOtp", "Verify OTP")}
              </Button>

              <Anchor
                size="sm"
                onClick={() => {
                  setStep("signup");
                  setOtp("");
                  setOtpError(null);
                }}
                style={{ cursor: "pointer" }}
              >
                {translation("signup.linkBackToSignup", "Back to signup")}
              </Anchor>
            </Stack>
          </form>
        )}
      </Paper>
    </div>
  );
}
