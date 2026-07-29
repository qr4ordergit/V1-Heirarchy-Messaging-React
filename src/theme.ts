import { createTheme, type MantineColorsTuple } from "@mantine/core";

const brandPurple: MantineColorsTuple = [
  "#eeecfd",
  "#d7d2fa",
  "#b0a7f5",
  "#8679ef",
  "#6350ea",
  "#4b3ff2",
  "#4335d6",
  "#372bb3",
  "#2e23b0",
  "#241a86",
];

export const theme = createTheme({
  primaryColor: "brandPurple",
  colors: { brandPurple },
  fontFamily: "Inter, sans-serif",
  headings: { fontFamily: "Space Grotesk, sans-serif", fontWeight: "700" },
  defaultRadius: "md",
  defaultGradient: { from: "#4b3ff2", to: "#2e23b0", deg: 135 },
});
