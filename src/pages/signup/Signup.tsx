import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { signup, verifyOtp } from "../../config/authApi";
import { ROUTES } from "../../router/routes";
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
  const navigate = useNavigate();

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

  const handleChange =
    (field: keyof SignupFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ?? "";
      setValues((prev) => ({ ...prev, [field]: value }));
    };

  const validate = (): boolean => {
    const newErrors: SignupFormErrors = {};

    if (!values.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!values.password) {
      newErrors.password = "Password is required";
    } else if (values.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (values.confirmPassword !== values.password) {
      newErrors.confirmPassword = "Passwords do not match";
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
        // group_name: GROUP_NAME,
      });

      setInfoMessage(
        `${response.message} to your email via ${response.delivery_medium.toLowerCase()}.`,
      );
      setStep("verify");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Signup failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setOtpError(null);

    if (otp.length < 6) {
      setOtpError("Enter the 6-digit code sent to your email");
      return;
    }

    try {
      setSubmitting(true);
      await verifyOtp({ email: values.email.trim(), otp });
      navigate(ROUTES.LOGIN);
    } catch (err) {
      setOtpError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Container size={460} my={80}>
        <Title className={classes.title} ta="center">
          {step === "signup" ? "Create your account" : "Verify your email"}
        </Title>

        {step === "signup" ? (
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            Already have an account?{" "}
            <Anchor component={Link} to={ROUTES.LOGIN} size="sm">
              Login
            </Anchor>
          </Text>
        ) : (
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            We sent a code to <strong>{values.email}</strong>
          </Text>
        )}

        <Paper withBorder shadow="md" p={30} radius="md" mt="xl">
          {step === "signup" ? (
            <form onSubmit={handleSubmit} noValidate>
              <Stack gap="md">
                {apiError && (
                  <Alert color="red" title="Signup failed">
                    {apiError}
                  </Alert>
                )}

                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={handleChange("email")}
                  error={errors.email}
                  required
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  value={values.password}
                  onChange={handleChange("password")}
                  error={errors.password}
                  required
                />
                <PasswordInput
                  label="Confirm password"
                  placeholder="Confirm your password"
                  value={values.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  error={errors.confirmPassword}
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  mt="md"
                  radius="xl"
                  variant="gradient"
                  loading={submitting}
                >
                  Sign up
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleVerify} noValidate>
              <Stack gap="md" align="center">
                {infoMessage && (
                  <Alert color="blue" title="Check your inbox" w="100%">
                    {infoMessage}
                  </Alert>
                )}
                {otpError && (
                  <Alert color="red" title="Verification failed" w="100%">
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
                  Verify OTP
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
                  Back to signup
                </Anchor>
              </Stack>
            </form>
          )}
        </Paper>
      </Container>
    </div>
  );
}
