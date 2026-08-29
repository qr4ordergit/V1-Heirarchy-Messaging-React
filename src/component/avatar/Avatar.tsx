import { colorFor, initials } from "../../config/avatarColors";
import classes from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  size?: number;
  colorIndex?: number;
  onClick?: () => void;
  src?: string | null;
}

export default function Avatar({
  name,
  size = 44,
  colorIndex = 0,
  onClick,
  src,
}: AvatarProps) {
  return (
    <div
      className={classes.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: src ? undefined : colorFor(colorIndex),
        cursor: onClick ? "pointer" : undefined,
        padding: 0,
        overflow: "hidden",
      }}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "inherit",
          }}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}
