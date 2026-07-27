import { Loader, Overlay } from "@mantine/core";

export default function LazyLoader() {
  return (
    <Overlay
      fixed
      blur={2}
      backgroundOpacity={0.35}
      zIndex={9999}
    >
      <div className="flex h-full w-full items-center justify-center">
        <Loader size="lg" />
      </div>
    </Overlay>
  );
}