export const PALETTE = [
  "#4B3FF2",
  "#17B890",
  "#FF6B4A",
  "#3F8CFF",
  "#B34BF2",
  "#F2B705",
];

export function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export function initials(name: string): string {
  return (name || "")
    .split(/[.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}
