import {
  Accordion,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconCheck,
  IconCrown,
  IconLock,
  IconMail,
  IconTable,
} from "@tabler/icons-react";
import { useTranslation } from "../../store/language/language.store";

export interface FeatureRowRendered {
  key?: string;
  feature: string;
  featureDescription?: string;
  usage: string | number;
  isPaidOnly?: boolean;
}

interface Props {
  isPaid: boolean;
  freeFeatures: FeatureRowRendered[];
  paidFeatures: FeatureRowRendered[];
  allCombinedFeatures: FeatureRowRendered[];
  upgrading: boolean;
  onUpgrade: () => void;
}

/** Accordion section 1: Features & Usage */
export default function FeaturesSection({
  isPaid,
  freeFeatures,
  paidFeatures,
  allCombinedFeatures,
  upgrading,
  onUpgrade,
}: Props) {
  const { translation } = useTranslation();

  const renderTable = (rows: FeatureRowRendered[], showLockBanner = false) => (
    <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
      <Table
        striped
        highlightOnHover
        withTableBorder={false}
        verticalSpacing="sm"
      >
        <Table.Thead bg="gray.0">
          {!showLockBanner && (
            <Table.Tr>
              <Table.Th style={{ width: "65%" }}>
                {translation(
                  "account_billing.thFeatureDescription",
                  "Feature Description",
                )}
              </Table.Th>
              <Table.Th style={{ width: "35%", textAlign: "right" }}>
                {translation("account_billing.thCurrentUsage", "Current Usage")}
              </Table.Th>
            </Table.Tr>
          )}
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => {
            const isLocked = Boolean(row.isPaidOnly && !isPaid);

            return (
              <Table.Tr key={index}>
                <Table.Td>
                  <Group gap="sm" align="flex-start" wrap="nowrap">
                    <ThemeIcon
                      size={22}
                      radius="xl"
                      variant="light"
                      color={isLocked ? "red" : "teal"}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    >
                      {isLocked ? (
                        <IconLock size={13} />
                      ) : (
                        <IconCheck size={13} />
                      )}
                    </ThemeIcon>

                    <Stack gap={1}>
                      <Text size="sm" fw={row.isPaidOnly ? 600 : 500}>
                        {row.feature}
                      </Text>
                      {row.featureDescription && (
                        <Text size="xs" c="dimmed" lh={1.35}>
                          {row.featureDescription}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Table.Td>

                <Table.Td
                  style={{ textAlign: "right", verticalAlign: "middle" }}
                >
                  {isLocked ? (
                    <Button
                      component="a"
                      href={`mailto:support@messenger.com?subject=Inquiry%20Regarding%20${encodeURIComponent(
                        row.feature,
                      )}&body=Hello%20Team%2C%0A%0AI%20am%20interested%20in%20unlocking%20${encodeURIComponent(
                        row.feature,
                      )}%20for%20my%20Hub.`}
                      variant="light"
                      color="gray"
                      size="compact-xs"
                      radius="xl"
                      leftSection={<IconMail size={13} />}
                      style={{ fontWeight: 500 }}
                    >
                      {translation(
                        "account_billing.btnContactUs",
                        "Contact us",
                      )}
                    </Button>
                  ) : (
                    <Text
                      size="sm"
                      fw={600}
                      c={
                        String(row.usage).includes(
                          translation(
                            "account_billing.txtUnlimited",
                            "Unlimited",
                          ),
                        )
                          ? "dimmed"
                          : "dark"
                      }
                    >
                      {row.usage}
                    </Text>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {showLockBanner && !isPaid && (
        <Paper p="md" bg="blue.0" style={{ borderTop: "1px solid #d0ebff" }}>
          <Group justify="flex-end">
            <Button
              size="sm"
              variant="filled"
              color="indigo"
              radius="md"
              leftSection={<IconCrown size={15} />}
              loading={upgrading}
              onClick={onUpgrade}
            >
              {translation(
                "account_billing.btnUpgradeToPaid",
                "Upgrade to Paid",
              )}
            </Button>
          </Group>
        </Paper>
      )}
    </Paper>
  );

  return (
    <Accordion.Item value="features">
      <Accordion.Control
        icon={
          <ThemeIcon variant="light" color="indigo" radius="md" size={32}>
            <IconTable size={18} />
          </ThemeIcon>
        }
      >
        <div>
          <Text fw={600} size="md">
            {translation(
              "account_billing.accordionFeaturesTitle",
              "Features & Usage",
            )}
          </Text>
          <Text size="xs" c="dimmed">
            {translation(
              "account_billing.accordionFeaturesDesc",
              "Detailed quota tracking, limits, and active features",
            )}
          </Text>
        </div>
      </Accordion.Control>

      <Accordion.Panel>
        {isPaid ? (
          <Stack gap="md">
            <Text fw={600} size="sm" c="dimmed" tt="uppercase">
              {translation(
                "account_billing.txtActiveSubAllowances",
                "Active Subscription Allowances",
              )}
            </Text>
            {renderTable(allCombinedFeatures)}
          </Stack>
        ) : (
          <Stack gap="xl">
            <Stack gap="xs">{renderTable(freeFeatures)}</Stack>
            <Stack gap="xs">
              <Text fw={700} size="sm" c="red.7" tt="uppercase">
                {translation(
                  "account_billing.txtPaidFeaturesNotice",
                  "Paid Features — Unlock by switching to Paid Membership",
                )}
              </Text>
              {renderTable(paidFeatures, true)}
            </Stack>
          </Stack>
        )}
      </Accordion.Panel>
    </Accordion.Item>
  );
}
