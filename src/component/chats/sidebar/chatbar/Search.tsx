import { Input } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

function Search() {
  return (
    <Input
      placeholder="Search"
      leftSection={<IconSearch stroke={2} size={16} />}
    />
  );
}

export default Search;
