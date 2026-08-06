import { Divider, Group, Stack, Switch, Text } from "@mantine/core";
import type { PermissionsTree } from "../../api/permissionsApi";
import classes from "./PermissionsEditor.module.css";

interface PermissionsEditorProps {
  tree: PermissionsTree;
  onToggle: (path: string[]) => void;
  path?: string[];
  depth?: number;
}

function toLabel(key: string): string {
  return key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PermissionsEditor({
  tree,
  onToggle,
  path = [],
  depth = 0,
}: PermissionsEditorProps) {
  const entries = Object.entries(tree);

  return (
    <Stack gap={depth === 0 ? "lg" : "xs"} pl={depth > 0 ? "md" : 0}>
      {entries.map(([key, value]) => {
        const currentPath = [...path, key];

        if (typeof value === "boolean") {
          return (
            <Group key={key} justify="space-between" wrap="nowrap">
              <Text size="sm">{toLabel(key)}</Text>
              <Switch checked={value} onChange={() => onToggle(currentPath)} />
            </Group>
          );
        }

        return (
          <div key={key}>
            <Text
              size={depth === 0 ? "sm" : "xs"}
              fw={700}
              tt="uppercase"
              c="dimmed"
              className={classes.groupLabel}
              mb={6}
            >
              {toLabel(key)}
            </Text>
            <PermissionsEditor
              tree={value}
              onToggle={onToggle}
              path={currentPath}
              depth={depth + 1}
            />
            {depth === 0 && <Divider mt="md" />}
          </div>
        );
      })}
    </Stack>
  );
}
