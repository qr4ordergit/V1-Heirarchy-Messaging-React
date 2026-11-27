import { Checkbox, ScrollArea, Stack, Text } from "@mantine/core";
import { useParams } from "react-router";
import { useTranslation } from "../../../../../store/language/language.store";
import { useTagStore } from "../../../../../store/tags/tags.store";

interface TAGS_PROVIDER {
  selectedTags: string[];
  setSelectedTags: (value: string[]) => void;
}

function TagsProvider({ selectedTags, setSelectedTags }: TAGS_PROVIDER) {
  const { tagsWithCategories } = useTagStore((state) => state);

  const { chatId } = useParams<{ chatId: string }>();
  const { translation } = useTranslation();

  return (
    <div>
      {chatId?.includes("group") && (
        <Checkbox.Group
          value={selectedTags}
          onChange={setSelectedTags}
          label={translation(
            "chat_history.modal-tag-label1",
            "Default group tags",
          )}
        >
          {tagsWithCategories.group?.length ? (
            <ScrollArea
              h={Math.min(tagsWithCategories.group?.length * 30, 150)}
            >
              <Stack gap="sm">
                {tagsWithCategories?.group.map((tag) => (
                  <Checkbox key={tag} value={tag} label={tag} />
                ))}
              </Stack>
            </ScrollArea>
          ) : (
            <Text size="sm" className="text-red-500">
              {translation(
                "chat_history.modal-tag-empty1",
                "Tags not available",
              )}
            </Text>
          )}
        </Checkbox.Group>
      )}
      <Checkbox.Group
        value={selectedTags}
        onChange={setSelectedTags}
        label={translation(
          "chat_history.modal-tag-label2",
          "Tags created by you",
        )}
      >
        {tagsWithCategories.user?.length ? (
          <ScrollArea h={Math.min(tagsWithCategories.user?.length * 30, 150)}>
            <Stack gap="sm">
              {tagsWithCategories?.user.map((tag) => (
                <Checkbox key={tag} value={tag} label={tag} />
              ))}
            </Stack>
          </ScrollArea>
        ) : (
          <Text variant="danger">
            {translation("chat_history.modal-tag-empty2", "Tags not available")}
          </Text>
        )}
      </Checkbox.Group>
    </div>
  );
}

export default TagsProvider;
