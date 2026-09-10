import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  PasswordInput,
  PinInput,
  SegmentedControl,
  Select,
  Stack,
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
import { useAuthStore } from "../../store/auth/auth.store";
import { useTranslation } from "../../store/language/language.store";
import { COUNTRY_CODES } from "../../utils/constant";
import classes from "./Accounts.module.css";
import BulkUploadPanel from "./BulkUploadPanel";

type AddAccountMode = "single" | "bulk";

type IdentifierType = "username" | "email" | "phone";

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
};

interface NewAccountErrors {
  username?: string;
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
  const userDetails = useAuthStore((state) => state.userDetails);

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
    if (form.identifierType === "username") {
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
        displayName: form.displayName,
        description: form.description,
      });

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
        displayName: form.displayName,
        description: form.description,
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
                      {translation("create_account_modal.btnVerify", "Verify")}
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
                          form.username === suggestion.replace(/[#\s-]/g, "") &&
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
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={handleClose}>
              {translation("create_account_modal.btnCancel", "Cancel")}
            </Button>
            <Button
              radius="xl"
              variant="gradient"
              loading={submitting}
              disabled={form.identifierType === "username" && !usernameVerified}
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
