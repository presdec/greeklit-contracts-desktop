import { useEffect, useState } from 'react';
import { Combobox, TextInput, useCombobox } from '@mantine/core';

type Props = {
  data: string[];
  onChange: (value: string | null) => void;
  placeholder?: string;
  value: string | null;
};

/** Convert arbitrary typed text into a valid SCREAMING_SNAKE_CASE variable name. */
function toVariableName(text: string): string {
  return text.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * A searchable + creatable select for variable names.
 * - Type to filter existing options.
 * - If no exact match, offers "＋ Create «SANITIZED_NAME»".
 * - On blur, commits an exact match or resets to the last committed value.
 */
export function CreatableSelect({ data, onChange, placeholder, value }: Props) {
  const [search, setSearch] = useState(value ?? '');
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });

  // Sync display when external value changes (e.g. after save/load or external clear)
  useEffect(() => {
    setSearch(value ?? '');
  }, [value]);

  const filtered = search
    ? data.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
    : data;

  const exactMatch = data.some((item) => item.toLowerCase() === search.toLowerCase());
  const sanitized = toVariableName(search);

  function handleSelect(val: string) {
    onChange(val || null);
    setSearch(val);
    combobox.closeDropdown();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.currentTarget.value);
    combobox.openDropdown();
    combobox.updateSelectedOptionIndex();
    if (!e.currentTarget.value) {
      onChange(null);
    }
  }

  function handleBlur() {
    combobox.closeDropdown();
    // If typed text exactly matches an option (case-insensitive), commit the canonical casing
    const match = data.find((item) => item.toLowerCase() === search.toLowerCase());
    if (match) {
      onChange(match);
      setSearch(match);
    } else {
      // Discard partial text — reset to committed value
      setSearch(value ?? '');
    }
  }

  return (
    <Combobox store={combobox} onOptionSubmit={handleSelect} withinPortal={false}>
      <Combobox.Target>
        <TextInput
          onBlur={handleBlur}
          onChange={handleChange}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          placeholder={placeholder}
          value={search}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {filtered.map((item) => (
            <Combobox.Option key={item} value={item}>
              {item}
            </Combobox.Option>
          ))}
          {!exactMatch && sanitized ? (
            <Combobox.Option value={sanitized}>
              + Create «{sanitized}»
            </Combobox.Option>
          ) : null}
          {filtered.length === 0 && !sanitized ? (
            <Combobox.Empty>No options</Combobox.Empty>
          ) : null}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
