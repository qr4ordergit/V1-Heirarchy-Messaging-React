import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconCrown,
  IconSparkles,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import { useAuthStore } from "../../store/auth/auth.store";
import { useTranslation } from "../../store/language/language.store";
import {
  getAccountPackagesApi,
  assignAccountPackageApi,
  updateAccountPackagesApi,
  fetchFreshUserDetailsApi,
  type PackageItem,
  type UserPackageDetail,
} from "../../api/plansApi";

const Plans = () => {
  const navigate = useNavigate();
  const userDetails = useAuthStore((state) => state.userDetails);
  const setUserDetails = useAuthStore((state) => state.setUserDetails);
  const { translation } = useTranslation();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [submittingPackageId, setSubmittingPackageId] = useState<string | null>(
    null,
  );

  const [localIsPaid, setLocalIsPaid] = useState<boolean>(false);
  const [activePackageIds, setActivePackageIds] = useState<string[]>([]);

  useEffect(() => {
    if (userDetails) {
      const isPaid = Boolean((userDetails as any)?.is_paid);
      setLocalIsPaid(isPaid);

      const pkgDetails: UserPackageDetail[] =
        (userDetails as any)?.packageDetails || [];
      const ids = pkgDetails.map((pkg) => pkg.package_id);
      setActivePackageIds(ids);
    }
  }, [userDetails]);

  useEffect(() => {
    const loadPackages = async () => {
      setLoadingPackages(true);
      const data = await getAccountPackagesApi();
      setPackages(data);
      setLoadingPackages(false);
    };

    void loadPackages();
  }, []);

  const handleSelectPackage = async (packageItem: PackageItem) => {
    const isCurrentlySubscribed = activePackageIds.includes(packageItem._id);
    if (isCurrentlySubscribed) return;

    setSubmittingPackageId(packageItem._id);

    let isSuccess = false;

    if (!localIsPaid) {
      isSuccess = await assignAccountPackageApi(packageItem._id);
    } else {
      isSuccess = await updateAccountPackagesApi([packageItem._id]);
    }

    if (isSuccess) {
      setActivePackageIds([packageItem._id]);
      setLocalIsPaid(true);

      const freshData = await fetchFreshUserDetailsApi();
      if (freshData) {
        setUserDetails(freshData);
        if (freshData.is_paid !== undefined) {
          setLocalIsPaid(Boolean(freshData.is_paid));
        }
        if (Array.isArray(freshData.packageDetails)) {
          setActivePackageIds(
            freshData.packageDetails.map((p: any) => p.package_id),
          );
        }
      }
    }

    setSubmittingPackageId(null);
  };

  return (
    <div className="w-full min-h-[calc(100vh-100px)] py-6 px-4 bg-gray-50/50">
      <Container size="lg">
        <div className="flex justify-start mb-4">
          <Tooltip
            label={translation("plans.tooltipGoBack", "Go back")}
            position="right"
            withArrow
          >
            <ActionIcon
              variant="default"
              size="lg"
              radius="md"
              className="cursor-pointer border-gray-200 shadow-xs hover:bg-gray-100 transition-colors"
              onClick={() => navigate(-1)}
              aria-label={translation("plans.tooltipGoBack", "Go back")}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>
        </div>

        <Stack align="center" gap="xs" mb="xl">
          <Badge
            variant="light"
            color="indigo"
            size="lg"
            radius="sm"
            leftSection={<IconSparkles size={14} />}
          >
            {translation("plans.badgeSubscriptionPlans", "Subscription Plans")}
          </Badge>
          <Title order={2} ta="center" className="text-gray-900 tracking-tight">
            {translation(
              "plans.titleChoosePlan",
              "Choose the Perfect Plan for Your Hub",
            )}
          </Title>
          <Text c="dimmed" size="sm" ta="center" maw={540}>
            {translation(
              "plans.txtChoosePlanDesc",
              "Scale your messenger hub limits. Upgrade anytime to create more users and custom unique handles.",
            )}
          </Text>
        </Stack>

        {loadingPackages ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader size="md" color="indigo" />
            <Text size="sm" c="dimmed">
              {translation(
                "plans.txtLoadingPackages",
                "Loading available subscription packages...",
              )}
            </Text>
          </div>
        ) : packages.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {packages.map((pkg) => {
              const isSelected = activePackageIds.includes(pkg._id);
              const isSubmitting = submittingPackageId === pkg._id;

              return (
                <Card
                  key={pkg._id}
                  withBorder
                  radius="lg"
                  p="lg"
                  className={`flex flex-col justify-between transition-all duration-200 bg-white ${
                    isSelected
                      ? "border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                      : "border-gray-200 hover:shadow-sm hover:border-gray-300"
                  }`}
                >
                  <Stack gap="sm">
                    <Group justify="space-between" align="center">
                      <Title order={4} className="text-gray-900">
                        {pkg.package_name}
                      </Title>
                      {isSelected ? (
                        <Badge
                          color="indigo"
                          variant="filled"
                          size="sm"
                          radius="sm"
                        >
                          {translation(
                            "plans.badgeCurrentPlan",
                            "Current Plan",
                          )}
                        </Badge>
                      ) : (
                        <Badge
                          color="gray"
                          variant="light"
                          size="sm"
                          radius="sm"
                        >
                          {translation("plans.badgeId", "ID:")} {pkg._id}
                        </Badge>
                      )}
                    </Group>

                    <Text size="xs" c="dimmed">
                      {pkg.custom_user_creation_limit > 0
                        ? translation(
                            "plans.txtIdealGrowingTeams",
                            "Ideal for growing teams with custom usernames",
                          )
                        : translation(
                            "plans.txtEssentialLimits",
                            "Essential limits for light messenger usage",
                          )}
                    </Text>

                    <Paper
                      withBorder
                      p="xs"
                      radius="md"
                      className="bg-gray-50/70 border-gray-100 my-2"
                    >
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Group gap={6}>
                            <ThemeIcon
                              size={24}
                              radius="xl"
                              color="indigo"
                              variant="light"
                            >
                              <IconUsers size={14} />
                            </ThemeIcon>
                            <Text size="xs" fw={500} c="dimmed">
                              {translation(
                                "plans.txtTotalUsers",
                                "Total Users",
                              )}
                            </Text>
                          </Group>
                          <Text size="sm" fw={700} className="text-gray-800">
                            {pkg.total_user_creation_limit}
                          </Text>
                        </Group>

                        <Group justify="space-between">
                          <Group gap={6}>
                            <ThemeIcon
                              size={24}
                              radius="xl"
                              color="indigo"
                              variant="light"
                            >
                              <IconUserCheck size={14} />
                            </ThemeIcon>
                            <Text size="xs" fw={500} c="dimmed">
                              {translation(
                                "plans.txtCustomUsers",
                                "Custom Users",
                              )}
                            </Text>
                          </Group>
                          <Text size="sm" fw={700} className="text-gray-800">
                            {pkg.custom_user_creation_limit}
                          </Text>
                        </Group>
                      </Stack>
                    </Paper>

                    <Stack gap={6} mt="xs">
                      <Group gap={6}>
                        <IconCheck size={16} className="text-green-600" />
                        <Text size="xs" className="text-gray-700">
                          {translation(
                            "plans.txtFullHubFunctionality",
                            "Full Hub functionality",
                          )}
                        </Text>
                      </Group>
                      <Group gap={6}>
                        <IconCheck size={16} className="text-green-600" />
                        <Text size="xs" className="text-gray-700">
                          {translation(
                            "plans.txtE2eEncryption",
                            "End-to-end encryption",
                          )}
                        </Text>
                      </Group>
                      <Group gap={6}>
                        <IconCheck size={16} className="text-green-600" />
                        <Text size="xs" className="text-gray-700">
                          {translation(
                            "plans.txtGroupDmMessaging",
                            "Group & DM messaging",
                          )}
                        </Text>
                      </Group>
                    </Stack>
                  </Stack>

                  <Button
                    fullWidth
                    mt="lg"
                    radius="md"
                    size="sm"
                    color="indigo"
                    variant={isSelected ? "light" : "filled"}
                    disabled={isSelected || Boolean(submittingPackageId)}
                    loading={isSubmitting}
                    leftSection={
                      isSelected ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCrown size={16} />
                      )
                    }
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    {isSelected
                      ? translation("plans.btnActivePlan", "Active Plan")
                      : localIsPaid
                        ? translation("plans.btnSwitchToPlan", "Switch to Plan")
                        : translation("plans.btnChoosePlan", "Choose Plan")}
                  </Button>
                </Card>
              );
            })}
          </SimpleGrid>
        ) : (
          <div className="py-20 text-center">
            <Text c="dimmed" size="sm">
              {translation(
                "plans.txtNoPackagesAvailable",
                "No packages currently available. Please check back later.",
              )}
            </Text>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Plans;
