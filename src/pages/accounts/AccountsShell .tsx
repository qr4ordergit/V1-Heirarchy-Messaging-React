import type { ReactNode } from "react";
import { useMediaQuery } from "@mantine/hooks";
import logo from "../../assets/logo.png";
import classes from "./AccountsShell.module.css";

type Props = {
  title: string;
  initial?: string;
  topbar: ReactNode;
  children: ReactNode;
};

export default function AccountsShell({ title, topbar, children }: Props) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (isMobile) {
    return (
      <div className={`app-background ${classes.mobile}`} aria-label={title}>
        <div className={classes.mobileHeader}>
          <img src={logo} alt="Ukrchat logo" className={classes.mobileLogo} />
          <div className={classes.mobileTop}>{topbar}</div>
        </div>
        <div className={classes.sheet}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`app-background ${classes.stage}`}>
      <div className={classes.shell}>
        <div className={classes.logo}>
          <img src={logo} alt="Ukrchat logo" />
        </div>
        <div className={classes.topbar}>{topbar}</div>
        <main className={classes.content}>{children}</main>
      </div>
    </div>
  );
}
