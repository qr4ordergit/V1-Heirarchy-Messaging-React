import { useState } from "react";
import { Combobox, InputBase, useCombobox } from "@mantine/core";
import { useTranslation } from "../../store/language/language.store";

interface PrefixComboboxProps {
  label: string;
  placeholder?: string;
  description?: string;

  options: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  classNames?: { label?: string };
}

const CREATE_PREFIX = "$create";

export const sanitizePrefix = (raw: string) =>
  raw.replace(/[^A-Za-z]/g, "").slice(0, 8);

export default function PrefixCombobox({
  label,
  placeholder,
  description,
  options,
  value,
  onChange,
  error,
  classNames,
}: PrefixComboboxProps) {
  const { translation } = useTranslation();
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const [search, setSearch] = useState(value);

  const query = search.trim();
  const exactMatch = options.some(
    (o) => o.toLowerCase() === query.toLowerCase(),
  );
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );
  const canCreate = query.length > 0 && !exactMatch;

  const commit = (next: string) => {
    onChange(next);
    setSearch(next);
  };

  return (
    <Combobox
      store={combobox}
      withinPortal
      onOptionSubmit={(val) => {
        if (val === CREATE_PREFIX) {
          commit(sanitizePrefix(search));
        } else {
          commit(val);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          description={description}
          classNames={classNames}
          placeholder={placeholder}
          value={search}
          error={error}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          onChange={(e) => {
            const next = sanitizePrefix(e.currentTarget.value);
            setSearch(next);
            onChange(next);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value);
          }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {filtered.map((item) => (
            <Combobox.Option value={item} key={item}>
              {item}
            </Combobox.Option>
          ))}
          {canCreate && (
            <Combobox.Option value={CREATE_PREFIX}>
              {translation("create_account_modal.txtCreatePrefix", "+ Create")}{" "}
              &quot;
              {sanitizePrefix(search)}&quot;
            </Combobox.Option>
          )}
          {filtered.length === 0 && !canCreate && (
            <Combobox.Empty>
              {translation(
                "create_account_modal.txtTypeToCreatePrefix",
                "Type to create a prefix",
              )}
            </Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
