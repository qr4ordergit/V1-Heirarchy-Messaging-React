import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  Group,
  Input,
  Loader,
  Modal,
  PasswordInput,
  PinInput,
  Radio,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  UnstyledButton,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";

import {
  createAccount,
  verifySubUserOtp,
  withCountryCode,
  type BulkJobState,
} from "../../api/accountApi";
import { suggestUsername } from "../../api/authApi";
import { fetchUserDetails } from "../../api/userApi";
import PrefixCombobox from "./PrefixCombobox";
import { useAuthStore } from "../../store/auth/auth.store";
import { useTranslation } from "../../store/language/language.store";
import { COUNTRY_CODES } from "../../utils/constant";
import classes from "./Accounts.module.css";
import BulkUploadPanel from "./BulkUploadPanel";

type AddAccountMode = "single" | "bulk";

type IdentifierType = "username" | "email" | "phone";

type UsernameType = "normal" | "custom";

interface NewAccountForm {
  identifierType: IdentifierType;
  username: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  description: string;
  usernameType: UsernameType;
  customPrefix: string;
  usernameInfo: string;
  usernameSuffix: string;
  isBot: boolean;
}

const EMPTY_FORM: NewAccountForm = {
  identifierType: "username",
  username: "",
  email: "",
  phone: "",
  countryCode: "+91",
  password: "",
  confirmPassword: "",
  displayName: "",
  description: "",
  usernameType: "normal",
  customPrefix: "",
  usernameInfo: "",
  usernameSuffix: "",
  isBot: false,
};

interface NewAccountErrors {
  username?: string;
  customPrefix?: string;
  usernameInfo?: string;
  usernameSuffix?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

interface CreateAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onAccountCreated: () => void | Promise<void>;
  startInBulkMode?: boolean;
  bulkJob?: BulkJobState;
  onBulkUpload: (file: File) => void;
  onDiscardBulkJob?: () => void;
}

export default function CreateAccountModal({
  opened,
  onClose,
  onAccountCreated,
  startInBulkMode = false,
  bulkJob = { status: "idle" },
  onBulkUpload,
  onDiscardBulkJob,
}: CreateAccountModalProps) {
  const { translation } = useTranslation();
  const navigate = useNavigate();
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const savedPrefixes = userDetails?.custom_prefixes ?? [];
  const isPaidUser = Boolean(userDetails?.is_paid);

  const [mode, setMode] = useState<AddAccountMode>("single");

  useEffect(() => {
    if (opened && startInBulkMode) {
      setMode("bulk");
    }
  }, [opened, startInBulkMode]);

  const [form, setForm] = useState<NewAccountForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<NewAccountErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [accountStep, setAccountStep] = useState<"form" | "verify">("form");
  const [accountOtp, setAccountOtp] = useState("");
  const [accountOtpError, setAccountOtpError] = useState<string | null>(null);
  const [verifyingAccountOtp, setVerifyingAccountOtp] = useState(false);
  const [resendingAccountOtp, setResendingAccountOtp] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingUsername, setPendingUsername] = useState("");

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameVerified, setUsernameVerified] = useState(false);

  const setField = (field: keyof NewAccountForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const composedPhone = () => `${form.countryCode}${form.phone.trim()}`;

  const getEffectiveDisplayName = () => {
    const typed = form.displayName.trim();
    const fallback =
      form.identifierType === "username"
        ? form.username.trim()
        : form.identifierType === "email"
          ? form.email.trim()
          : composedPhone();
    const base = typed || fallback;

    if (isPaidUser || !base) return typed;
  };

  const fetchUsernameSuggestionsOnce = async (rawUsername: string) => {
    const trimmed = rawUsername.trim().replace(/-/g, "");
    if (trimmed.length < 3) return;

    setUsernameChecking(true);
    try {
      const result = await suggestUsername(trimmed);
      setUsernameSuggestions(result.suggestions ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : translation(
              "create_account_modal.errCouldNotCheckUsername",
              "Could not check username.",
            );

      setUsernameSuggestions([]);

      notifications.show({
        color: "red",
        title: translation(
          "create_account_modal.ntfyUsernameUnavailableTitle",
          "Username unavailable",
        ),
        message,
      });
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleIdentifierChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      identifierType: value as IdentifierType,
      username: "",
      email: "",
      phone: "",
    }));
    setFormErrors({});
    setUsernameSuggestions([]);
    setUsernameVerified(false);
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.replace(/[#\s-]/g, "");
    setField("username")(sanitized);
    setUsernameVerified(false);
    setUsernameSuggestions([]);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setField("username")(suggestion);
    setUsernameVerified(true);
  };

  const validate = (): boolean => {
    const errors: NewAccountErrors = {};
    if (form.identifierType === "username" && form.usernameType === "custom") {
      if (!/^[A-Za-z]{3,8}$/.test(form.customPrefix)) {
        errors.customPrefix = translation(
          "create_account_modal.errPrefixInvalid",
          "Prefix must be 3-8 letters (A-Z only)",
        );
      }
      const info = form.usernameInfo.trim();
      if (info.length < 3 || info.length > 16) {
        errors.usernameInfo = translation(
          "create_account_modal.errUsernameInfoLength",
          "Username must be 3-16 characters",
        );
      }
      if (!/^\d{3,16}$/.test(form.usernameSuffix)) {
        errors.usernameSuffix = translation(
          "create_account_modal.errSuffixInvalid",
          "Suffix must be 3-16 digits",
        );
      }
    } else if (form.identifierType === "username") {
      if (!form.username.trim()) {
        errors.username = translation(
          "create_account_modal.errUsernameRequired",
          "Username is required",
        );
      } else if (!usernameVerified) {
        errors.username = translation(
          "create_account_modal.errSelectSuggestedUsername",
          "Please select a suggested username",
        );
      }
    }
    if (form.identifierType === "email") {
      if (!form.email.trim()) {
        errors.email = translation(
          "create_account_modal.errEmailRequired",
          "Email is required",
        );
      } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        errors.email = translation(
          "create_account_modal.errEmailInvalid",
          "Enter a valid email",
        );
      }
    }
    if (form.identifierType === "phone") {
      const digits = form.phone.trim();
      if (!digits) {
        errors.phone = translation(
          "create_account_modal.errPhoneRequired",
          "Phone number is required",
        );
      } else if (digits.length < 7) {
        errors.phone = translation(
          "create_account_modal.errPhoneTooShort",
          "Phone number is too short",
        );
      } else if (digits.length > 12) {
        errors.phone = translation(
          "create_account_modal.errPhoneTooLong",
          "Phone number is too long",
        );
      }
    }
    if (!form.password) {
      errors.password = translation(
        "create_account_modal.errPasswordRequired",
        "Password is required",
      );
    } else if (form.password.length < 8) {
      errors.password = translation(
        "create_account_modal.errPasswordMinLength",
        "Password must be at least 8 characters",
      );
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = translation(
        "create_account_modal.errConfirmPasswordRequired",
        "Please confirm the password",
      );
    } else if (form.confirmPassword !== form.password) {
      errors.confirmPassword = translation(
        "create_account_modal.errPasswordMismatch",
        "Passwords do not match",
      );
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClose = () => {
    onClose();
    setMode("single");
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSubmitError(null);
    setUsernameSuggestions([]);
    setUsernameVerified(false);

    setAccountStep("form");
    setAccountOtp("");
    setAccountOtpError(null);
    setPendingPhone("");
    setPendingUsername("");
  };

  const handleUpgradeClick = () => {
    handleClose();
    navigate("/usage-billing");
  };

  const syncCustomPrefix = async (prefix: string) => {
    if (userDetails && !savedPrefixes.includes(prefix)) {
      setUserDetails({
        ...userDetails,
        custom_prefixes: [...savedPrefixes, prefix],
      });
    }
    try {
      setUserDetails(await fetchUserDetails());
    } catch {}
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      const trimmedPhone =
        form.identifierType === "phone" ? composedPhone() : form.phone.trim();
      const response = await createAccount({
        identifierType: form.identifierType,
        username: form.username.trim(),
        email: form.email.trim(),
        phone: trimmedPhone,
        password: form.password,
        displayName: getEffectiveDisplayName(),
        description: form.description,
        usernameType:
          form.identifierType === "username" ? form.usernameType : "normal",
        customPrefix: form.customPrefix,
        usernameInfo: form.usernameInfo.trim(),
        usernameSuffix: form.usernameSuffix,
        accountType: form.isBot ? "bot" : "user",
      });

      if (
        form.identifierType === "username" &&
        form.usernameType === "custom"
      ) {
        await syncCustomPrefix(form.customPrefix);
      }

      if (form.identifierType === "phone") {
        setPendingPhone(trimmedPhone);
        setPendingUsername(response.username || response.id || "");
        setAccountStep("verify");
        notifications.show({
          color: "blue",
          title: translation(
            "create_account_modal.ntfyVerificationCodeSentTitle",
            "Verification code sent",
          ),
          message:
            response.message ||
            translation(
              "create_account_modal.txtEnterCodeSentToPhone",
              "Enter the code sent to the phone number.",
            ),
        });
      } else {
        handleClose();
        await onAccountCreated();
        notifications.show({
          color: "teal",
          title: translation(
            "create_account_modal.ntfyAccountAddedTitle",
            "Account added",
          ),
          message: translation(
            "create_account_modal.ntfyAccountCreatedMsg",
            "The new account was created successfully.",
          ),
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : translation(
              "create_account_modal.errCouldNotCreateAccount",
              "Could not create account.",
            );
      setSubmitError(message);
      notifications.show({
        color: "red",
        title: translation(
          "create_account_modal.ntfyCouldntAddAccountTitle",
          "Couldn't add account",
        ),
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAccountOtp = async () => {
    setAccountOtpError(null);

    if (accountOtp.length < 6) {
      setAccountOtpError(
        translation(
          "create_account_modal.errOtpRequiredPhone",
          "Enter the 6-digit code sent to the phone number",
        ),
      );
      return;
    }

    try {
      setVerifyingAccountOtp(true);
      const response = await verifySubUserOtp({
        email: userDetails?.email ?? "",
        phone: pendingPhone,
        otp: accountOtp,
        username: pendingUsername,
      });

      if (response.message === "OTP verified successfully.") {
        handleClose();
        await onAccountCreated();
        notifications.show({
          color: "teal",
          title: translation(
            "create_account_modal.ntfyAccountAddedTitle",
            "Account added",
          ),
          message: translation(
            "create_account_modal.ntfyAccountVerifiedCreatedMsg",
            "The new account was verified and created successfully.",
          ),
        });
      } else {
        setAccountOtpError(
          response.message ||
            translation(
              "create_account_modal.errVerificationFailedGeneric",
              "Verification failed. Please try again.",
            ),
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : translation(
              "create_account_modal.errVerificationFailedGeneric",
              "Verification failed. Please try again.",
            );
      setAccountOtpError(message);
      notifications.show({
        color: "red",
        title: translation(
          "create_account_modal.alertVerificationFailedTitle",
          "Verification failed",
        ),
        message,
      });
    } finally {
      setVerifyingAccountOtp(false);
    }
  };

  const handleResendAccountOtp = async () => {
    setAccountOtpError(null);
    try {
      setResendingAccountOtp(true);
      const response = await createAccount({
        identifierType: "phone",
        username: form.username.trim(),
        email: form.email.trim(),
        phone: pendingPhone,
        password: form.password,
        displayName: getEffectiveDisplayName(),
        description: form.description,
        accountType: form.isBot ? "bot" : "user",
      });
      setPendingUsername(response.username || response.id || pendingUsername);
      setAccountOtp("");
      notifications.show({
        color: "blue",
        title: translation(
          "create_account_modal.ntfyVerificationCodeResentTitle",
          "Verification code resent",
        ),
        message:
          response.message ||
          translation(
            "create_account_modal.txtNewCodeSent",
            "A new code has been sent.",
          ),
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : translation(
              "create_account_modal.errCouldNotResendCode",
              "Could not resend the code.",
            );
      setAccountOtpError(message);
      notifications.show({
        color: "red",
        title: translation(
          "create_account_modal.ntfyCouldntResendCodeTitle",
          "Couldn't resend code",
        ),
        message,
      });
    } finally {
      setResendingAccountOtp(false);
    }
  };

  const usernameTrimmedLength = form.username.trim().length;
  const wandDisabled = usernameTrimmedLength < 3 || usernameVerified;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group justify="space-between" wrap="nowrap" style={{ width: "100%" }}>
          <Text fw={700} size="lg">
            {accountStep === "verify"
              ? translation(
                  "create_account_modal.titleVerifyPhoneNumber",
                  "Verify Phone Number",
                )
              : mode === "bulk"
                ? translation(
                    "create_account_modal.titleBulkUpload",
                    "Bulk Upload",
                  )
                : translation(
                    "create_account_modal.titleCreateAccount",
                    "Create Account",
                  )}
          </Text>

          {accountStep === "form" && (
            <Text
              component="button"
              type="button"
              onClick={() => setMode(mode === "bulk" ? "single" : "bulk")}
              fw={600}
              size="sm"
              c="blue"
              td="underline"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "end",
                marginLeft: "300px",
              }}
            >
              {mode === "bulk"
                ? translation(
                    "create_account_modal.btnSingleAccount",
                    "Single Account",
                  )
                : translation(
                    "create_account_modal.titleBulkUpload",
                    "Bulk Upload",
                  )}
            </Text>
          )}
        </Group>
      }
      centered
      radius="md"
      size="lg"
    >
      {accountStep === "form" && mode === "bulk" ? (
        <BulkUploadPanel
          job={bulkJob}
          onUpload={onBulkUpload}
          onClose={handleClose}
          onDiscard={
            onDiscardBulkJob
              ? () => {
                  onDiscardBulkJob();
                  handleClose();
                }
              : undefined
          }
        />
      ) : accountStep === "verify" ? (
        <Stack gap="md" align="center">
          {accountOtpError && (
            <Alert
              color="red"
              title={translation(
                "create_account_modal.alertVerificationFailedTitle",
                "Verification failed",
              )}
              w="100%"
            >
              {accountOtpError}
            </Alert>
          )}

          <Text c="dimmed" ta="center" size="sm">
            {translation(
              "create_account_modal.txtWeSentCodeTo",
              "We sent a code to",
            )}{" "}
            <strong>
              {pendingPhone !== ""
                ? withCountryCode(pendingPhone)
                : pendingUsername}
            </strong>
          </Text>

          <PinInput
            length={6}
            value={accountOtp}
            onChange={setAccountOtp}
            type="number"
          />

          <Group justify="flex-end" mt="xs" w="100%">
            <Button
              variant="subtle"
              onClick={() => {
                setAccountStep("form");
                setAccountOtp("");
                setAccountOtpError(null);
              }}
            >
              {translation("create_account_modal.btnBack", "Back")}
            </Button>
            <Button
              variant="subtle"
              loading={resendingAccountOtp}
              onClick={handleResendAccountOtp}
            >
              {translation("create_account_modal.btnResendCode", "Resend Code")}
            </Button>
            <Button
              radius="xl"
              variant="gradient"
              loading={verifyingAccountOtp}
              onClick={handleVerifyAccountOtp}
            >
              {translation(
                "create_account_modal.btnVerifyAndAddAccount",
                "Verify & Add Account",
              )}
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          {submitError && (
            <Alert
              color="red"
              title={translation(
                "create_account_modal.ntfyCouldntAddAccountTitle",
                "Couldn't add account",
              )}
            >
              {submitError}
            </Alert>
          )}

          <div>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={6}>
              {translation("create_account_modal.txtAddVia", "Add via")}
            </Text>
            <SegmentedControl
              fullWidth
              color="blue"
              radius="md"
              styles={{
                root: {
                  backgroundColor: "#fff",
                  border: "1px solid var(--mantine-color-gray-3)",
                },
                indicator: { backgroundColor: "var(--mantine-color-blue-6)" },
                label: { fontWeight: 600 },
              }}
              value={form.identifierType}
              onChange={handleIdentifierChange}
              data={[
                {
                  label: translation(
                    "create_account_modal.labelUsername",
                    "Username",
                  ),
                  value: "username",
                },
                {
                  label: translation(
                    "create_account_modal.labelPhone",
                    "Phone",
                  ),
                  value: "phone",
                },
              ]}
            />
          </div>

          {form.identifierType === "username" && (
            <Radio.Group
              value={form.usernameType}
              onChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  usernameType: value as UsernameType,
                }));
                setFormErrors({});
              }}
            >
              <Group grow align="stretch" gap="sm" wrap="nowrap">
                {(
                  [
                    {
                      value: "normal",
                      title: translation(
                        "create_account_modal.optNormalTitle",
                        "Normal",
                      ),
                      desc: translation(
                        "create_account_modal.optNormalDesc",
                        "We suggest an available username",
                      ),
                    },
                    {
                      value: "custom",
                      title: translation(
                        "create_account_modal.optCustomTitle",
                        "Custom",
                      ),
                      desc: translation(
                        "create_account_modal.optCustomDesc",
                        "Your own prefix-name-number",
                      ),
                    },
                  ] as const
                ).map((opt) => (
                  <Radio.Card
                    key={opt.value}
                    value={opt.value}
                    radius="md"
                    p="sm"
                    style={{
                      border:
                        form.usernameType === opt.value
                          ? "1.5px solid var(--mantine-color-blue-6)"
                          : "1.5px solid var(--mantine-color-gray-3)",
                      background:
                        form.usernameType === opt.value
                          ? "var(--mantine-color-blue-0)"
                          : undefined,
                    }}
                  >
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Radio.Indicator />
                      <div>
                        <Text fw={600} size="sm">
                          {opt.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {opt.desc}
                        </Text>
                      </div>
                    </Group>
                  </Radio.Card>
                ))}
              </Group>
            </Radio.Group>
          )}

          {form.identifierType === "username" &&
            form.usernameType === "custom" && (
              <Stack gap="sm">
                <PrefixCombobox
                  label={translation(
                    "create_account_modal.labelPrefix",
                    "Prefix",
                  )}
                  description={translation(
                    "create_account_modal.descPrefix",
                    "3-8 letters. Select a saved prefix or type a new one.",
                  )}
                  placeholder={translation(
                    "create_account_modal.placeholderPrefix",
                    "Select or create prefix",
                  )}
                  classNames={{ label: classes.fieldLabel }}
                  options={savedPrefixes}
                  value={form.customPrefix}
                  onChange={setField("customPrefix")}
                  error={formErrors.customPrefix}
                />
                <TextInput
                  label={translation(
                    "create_account_modal.labelUsername",
                    "Username",
                  )}
                  description={translation(
                    "create_account_modal.descCustomUsername",
                    "3-16 characters.",
                  )}
                  classNames={{ label: classes.fieldLabel }}
                  placeholder={translation(
                    "create_account_modal.placeholderCustomUsername",
                    "Enter name",
                  )}
                  value={form.usernameInfo}
                  maxLength={16}
                  onChange={(e) =>
                    setField("usernameInfo")(
                      e.target.value.replace(/[#\s-]/g, ""),
                    )
                  }
                  error={formErrors.usernameInfo}
                />
                <TextInput
                  label={translation(
                    "create_account_modal.labelSuffix",
                    "Suffix",
                  )}
                  description={translation(
                    "create_account_modal.descSuffix",
                    "3-16 digits.",
                  )}
                  classNames={{ label: classes.fieldLabel }}
                  placeholder={translation(
                    "create_account_modal.placeholderSuffix",
                    "Enter number",
                  )}
                  value={form.usernameSuffix}
                  inputMode="numeric"
                  onChange={(e) =>
                    setField("usernameSuffix")(
                      e.target.value.replace(/\D/g, "").slice(0, 16),
                    )
                  }
                  error={formErrors.usernameSuffix}
                />
                {(form.customPrefix ||
                  form.usernameInfo ||
                  form.usernameSuffix) && (
                  <Text size="xs" c="dimmed">
                    {translation(
                      "create_account_modal.txtUsernameWillBe",
                      "Username will be:",
                    )}{" "}
                    <strong
                      style={{
                        color: "var(--mantine-color-blue-6)",
                      }}
                    >
                      {[
                        form.customPrefix,
                        form.usernameInfo,
                        form.usernameSuffix,
                      ]
                        .filter(Boolean)
                        .join("-")}
                    </strong>
                  </Text>
                )}
              </Stack>
            )}

          {form.identifierType === "username" &&
            form.usernameType === "normal" && (
              <div>
                <TextInput
                  label={translation(
                    "create_account_modal.labelUsername",
                    "Username",
                  )}
                  classNames={{ label: classes.fieldLabel }}
                  placeholder={translation(
                    "create_account_modal.placeholderUsername",
                    "Enter username",
                  )}
                  value={form.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  error={formErrors.username}
                  rightSection={
                    usernameChecking ? (
                      <Loader size={14} />
                    ) : (
                      <Button
                        size="xs"
                        variant="subtle"
                        disabled={wandDisabled}
                        onClick={() =>
                          fetchUsernameSuggestionsOnce(form.username)
                        }
                      >
                        {translation(
                          "create_account_modal.btnVerify",
                          "Verify",
                        )}
                      </Button>
                    )
                  }
                  rightSectionWidth={70}
                />

                {usernameSuggestions.length > 0 && (
                  <Stack gap={4} mt={6}>
                    {usernameSuggestions && (
                      <Text size="xs" c="dimmed">
                        {translation(
                          "create_account_modal.txtChooseSuggestedUsername",
                          "Choose one of the suggested usernames below",
                        )}
                      </Text>
                    )}
                    <Group gap={6}>
                      {usernameSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          size="compact-xs"
                          variant={
                            form.username ===
                              suggestion.replace(/[#\s-]/g, "") &&
                            usernameVerified
                              ? "filled"
                              : "light"
                          }
                          radius="xl"
                          onClick={() => handleSelectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </Group>
                  </Stack>
                )}
              </div>
            )}

          {!isPaidUser && (
            <Text size="xs" c="dimmed">
              {translation(
                "create_account_modal.txtFreeAccountSuffix",
                "Premium account is available for paid users. Non-premium accounts get a default suffix.",
              )}{" "}
              <Text
                component="button"
                type="button"
                onClick={handleUpgradeClick}
                span
                size="xs"
                c="blue"
                fw={600}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {translation(
                  "create_account_modal.btnBecomePaidUser",
                  "Become a paid user",
                )}
              </Text>
            </Text>
          )}

          {form.identifierType === "phone" && (
            <Group gap={8} wrap="nowrap" align="flex-start">
              <Select
                label={translation("create_account_modal.labelCode", "Code")}
                classNames={{ label: classes.fieldLabel }}
                data={COUNTRY_CODES}
                value={form.countryCode}
                onChange={(value) => setField("countryCode")(value ?? "+91")}
                searchable
                allowDeselect={false}
                w={160}
                styles={{ input: { fontSize: 12 } }}
              />
              <TextInput
                label={translation(
                  "create_account_modal.labelPhoneNumber",
                  "Phone Number",
                )}
                classNames={{ label: classes.fieldLabel }}
                placeholder={translation(
                  "create_account_modal.placeholderPhoneNumber",
                  "Enter phone number",
                )}
                value={form.phone}
                onChange={(e) =>
                  setField("phone")(
                    e.target.value.replace(/[^\d]/g, "").slice(0, 12),
                  )
                }
                error={formErrors.phone}
                style={{ flex: 1 }}
              />
            </Group>
          )}

          <PasswordInput
            label={translation(
              "create_account_modal.labelPassword",
              "Password",
            )}
            classNames={{ label: classes.fieldLabel }}
            placeholder={translation(
              "create_account_modal.placeholderPassword",
              "Enter password",
            )}
            value={form.password}
            onChange={(e) => setField("password")(e.target.value)}
            error={formErrors.password}
          />

          <PasswordInput
            label={translation(
              "create_account_modal.labelConfirmPassword",
              "Confirm Password",
            )}
            classNames={{ label: classes.fieldLabel }}
            placeholder={translation(
              "create_account_modal.placeholderConfirmPassword",
              "Re-enter password",
            )}
            value={form.confirmPassword}
            onChange={(e) => setField("confirmPassword")(e.target.value)}
            error={formErrors.confirmPassword}
          />
          <TextInput
            label={translation(
              "create_account_modal.labelDisplayName",
              "Display Name",
            )}
            description={translation(
              "create_account_modal.descDisplayNameOptional",
              "Optional. Shown instead of the username when set.",
            )}
            classNames={{ label: classes.fieldLabel }}
            placeholder={translation(
              "create_account_modal.placeholderDisplayName",
              "Enter display name",
            )}
            value={form.displayName}
            onChange={(e) => setField("displayName")(e.target.value)}
          />

          <Textarea
            label={translation(
              "create_account_modal.labelDescriptionDesignation",
              "Description / Designation ",
            )}
            description={translation(
              "create_account_modal.descDescriptionOptional",
              "Optional. A short note about this account.",
            )}
            classNames={{ label: classes.fieldLabel }}
            placeholder={translation(
              "create_account_modal.placeholderDescription",
              "Enter description",
            )}
            value={form.description}
            onChange={(e) => setField("description")(e.target.value)}
            autosize
            minRows={2}
            maxRows={4}
          />
          <UnstyledButton
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, isBot: !prev.isBot }))}
            style={{
              width: "100%",
              padding: "6px 12px",
              borderRadius: "var(--mantine-radius-md)",
              border: form.isBot
                ? "1.5px solid var(--mantine-color-blue-6)"
                : "1.5px solid var(--mantine-color-gray-3)",
              background: form.isBot
                ? "var(--mantine-color-blue-0)"
                : undefined,
            }}
          >
            <Group
              justify="space-between"
              wrap="nowrap"
              align="center"
              gap="sm"
            >
              <div style={{ lineHeight: 1.25 }}>
                <Input.Label className={classes.fieldLabel}>
                  {translation(
                    "create_account_modal.labelBotAccount",
                    "Bot account",
                  )}
                </Input.Label>
                <Input.Description size="xs" style={{ lineHeight: 1.3 }}>
                  {translation(
                    "create_account_modal.descBotAccount",
                    "Enable bot access via AI Models including ChatGPT / Anthropic Claude",
                  )}
                </Input.Description>
              </div>
              <Switch
                size="sm"
                checked={form.isBot}
                onChange={() => {}}
                tabIndex={-1}
                aria-label={translation(
                  "create_account_modal.labelBotAccount",
                  "Bot account",
                )}
                style={{ pointerEvents: "none" }}
              />
            </Group>
          </UnstyledButton>
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={handleClose}>
              {translation("create_account_modal.btnCancel", "Cancel")}
            </Button>
            <Button
              radius="xl"
              variant="gradient"
              loading={submitting}
              disabled={
                form.identifierType === "username" &&
                form.usernameType === "normal" &&
                !usernameVerified
              }
              onClick={handleSubmit}
            >
              {translation("create_account_modal.btnAddAccount", "Add Account")}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
