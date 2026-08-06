import { Skeleton } from "@mantine/core";

export function ConversationShimmer() {
  return (
    <div className="grow overflow-hidden p-4 space-y-4">
      {/* Left Message */}
      <div className="flex justify-start">
        <Skeleton height={50} width="55%" radius="md" animate />
      </div>

      {/* Right Message */}
      <div className="flex justify-end">
        <Skeleton height={45} width="42%" radius="md" animate />
      </div>

      <div className="flex justify-start">
        <Skeleton height={70} width="65%" radius="md" animate />
      </div>

      <div className="flex justify-end">
        <Skeleton height={55} width="50%" radius="md" animate />
      </div>

      <div className="flex justify-start">
        <Skeleton height={45} width="38%" radius="md" animate />
      </div>

      <div className="flex justify-end">
        <Skeleton height={65} width="58%" radius="md" animate />
      </div>
    </div>
  );
}
