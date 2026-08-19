import { colorFor, initials } from "../../config/avatarColors";
import classes from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  size?: number;
  colorIndex?: number;
  onClick?: () => void;
}

export default function Avatar({
  name,
  size = 44,
  colorIndex = 0,
  onClick,
}: AvatarProps) {
  return (
    <div
      className={classes.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: colorFor(colorIndex),
        cursor: onClick ? "pointer" : undefined,
      }}
      onClick={onClick}
    >
      {initials(name)}
    </div>
  );
}
