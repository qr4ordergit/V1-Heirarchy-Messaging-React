import { Title, type TitleProps } from "@mantine/core";
import type { ReactNode } from "react";

interface HeadingProps extends TitleProps {
  children: ReactNode;
}

export default function Heading({
  children,
  order = 2,
  ...props
}: HeadingProps) {
  return (
    <Title
      order={order}
      style={{
        fontSize: "clamp(1rem, 1.5vw, 1.5rem)",
        lineHeight: 1.2,
      }}
      {...props}
    >
      {children}
    </Title>
  );
}