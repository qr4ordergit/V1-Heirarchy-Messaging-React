import {
  Box,
  Button,
  Flex,
  Loader,
  Select,
  type ComboboxItem,
} from "@mantine/core";
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Notification } from "../../../utils/notification";
import { ManageLanguagesServices } from "../../../api/services/manage.languages.service";

interface LangList {
  value: string;
  label: string;
}

const ManageLanguages = () => {
  const [active, setActive] = useState<string>("list");
  const [value, setValue] = useState<string>("");
  const [loadingJSON, setLoadingJSON] = useState<boolean>(false);
  const [saveLoading, setSaveLoadingJSON] = useState<boolean>(false);
  const [langList, setLangList] = useState<LangList[]>([]);
  const [selectedLang, setSelectedLang] = useState<ComboboxItem>({
    value: "en",
    label: "English",
  });

  const onClicTab = (type: string) => {
    setActive(type);
    setValue("");
    loadJSON(type);
  };

  const saveJSON = async () => {
    if (value === "") {
      Notification.error("JSON cannot be empty!");
      return;
    }
    try {
      setSaveLoadingJSON(true);
      let fileName = "language_list";
      if (active === "languages") {
        fileName = `${selectedLang.value}/${selectedLang.value}_language`;
      }
      await ManageLanguagesServices.update({
        data: JSON.parse(value),
        file: `${fileName}.json`,
      });
      if (active !== "languages") {
        await loadJSON(active)
      }
      Notification.success("Changes Saved Successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Notification.error(
          error.response?.data?.message || error.message,
          error.response?.data?.error,
        );
      } else if (error instanceof Error) {
        Notification.error(error.message);
      }
    } finally {
      setSaveLoadingJSON(false);
    }
  };

  const loadJSON = async (active: string, langCode: string = "en") => {
    try {
      setLoadingJSON(true);
      let fileName = "language_list";
      if (active === "languages") {
        fileName = `${langCode}/${langCode}_language`;
      }
      const json = await axios.get(
        `${import.meta.env.VITE_SKIN_LANGUAGE_API_URL}/${fileName}.json`,
      );
      setValue(JSON.stringify(json.data, null, 2));
      if (active !== "languages") {
        setLangList(
          Object.entries(json.data).map(([keys, value]) => ({
            value: keys,
            label: String(value),
          })),
        );
      }
    } catch {
      setValue("");
    } finally {
      setLoadingJSON(false);
    }
  };

  useEffect(() => {
    loadJSON(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Flex gap={"xs"} align={"center"}>
        <Button
          size="compact-xs"
          variant={active === "list" ? "filled" : "outline"}
          onClick={() => {
            onClicTab("list");
          }}
        >
          List
        </Button>
        <Button
          size="compact-xs"
          variant={active === "languages" ? "filled" : "outline"}
          onClick={() => {
            onClicTab("languages");
            setSelectedLang({value: "en",
    label: "English",})
          }}
        >
          Languages
        </Button>
        {active !== "list" && (
          <Select
            size="xs"
            placeholder="Select Language"
            data={langList}
            value={selectedLang ? selectedLang.value : null}
            onChange={(_value, option) => {
              setSelectedLang(option);
              if(option !== null){
                loadJSON(active, option.value);
              }else{
                setValue("")
              }
            }}
          />
        )}
      </Flex>

      {loadingJSON && (
        <Flex justify={"center"}>
          <Loader size={"xs"} />
        </Flex>
      )}

      {!loadingJSON && (
        <Box my={"md"}>
          <Editor
            height="420px"
            defaultLanguage="json"
            value={value}
            onChange={(value) => setValue(value ?? "")}
            options={{
              minimap: { enabled: false },
              formatOnPaste: true,
              formatOnType: true,
              automaticLayout: true,
            }}
          />
        </Box>
      )}

      {!loadingJSON && value !== "" && (
        <Flex justify={"end"}>
          <Button
            size="compact-xs"
            variant={"filled"}
            onClick={saveJSON}
            disabled={saveLoading}
          >
            Save changes
          </Button>
        </Flex>
      )}
    </>
  );
};
export default ManageLanguages;
