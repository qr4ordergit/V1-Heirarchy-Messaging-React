import { useEffect, useMemo, useRef } from "react";
import stageSvg from "./hierarchy-stage.svg?raw";
import classes from "./Home.module.css";
import {
  useLanguageStore,
  useTranslation,
} from "../../store/language/language.store";

// English text baked into hierarchy-stage.svg  ->  translation key.
const SVG_LABELS: Record<string, string> = {
  "Access Level": "svgAccessLevel",
  "(CRUD)": "svgCrud",
  Create: "svgCreate",
  Read: "svgRead",
  Update: "svgUpdate",
  Delete: "svgDelete",
  Manager: "svgRoleManager",
  Accountant: "svgRoleAccountant",
  CEO: "svgRoleCeo",
  Marketer: "svgRoleMarketer",
  "Team Lead": "svgRoleTeamLead",
};

type CellState = "active" | "locked" | string[];

const BLUE = "#004DCA";
const GREEN = "#00C448";
const AMBER = "#EB9400";
const RED = "#DF0000";

const MATRIX: Record<number, Record<number, CellState>> = {
  0: { 0: "active", 1: "locked", 2: "locked", 3: "locked", 4: [BLUE, AMBER] },
  1: { 0: "locked", 1: "active", 2: [BLUE], 3: [BLUE], 4: [BLUE] },
  2: {
    0: [GREEN, BLUE, AMBER, RED],
    1: [GREEN, BLUE, AMBER, RED],
    2: "active",
    3: [GREEN, BLUE, AMBER, RED],
    4: [GREEN, BLUE, AMBER, RED],
  },
  3: {
    0: [GREEN, BLUE],
    1: [GREEN, BLUE],
    2: "locked",
    3: "active",
    4: [GREEN, BLUE],
  },
  4: {
    0: [GREEN, BLUE, AMBER],
    1: [BLUE, AMBER],
    2: [BLUE, AMBER],
    3: [GREEN, BLUE, AMBER],
    4: "active",
  },
};

const DOT_COORDS: Record<number, { x: number; y: number; m: string }[]> = {
  0: [
    { x: 134.4, y: 558.5, m: "0.991445 -0.130526 0 1" },
    { x: 148.2, y: 556.7, m: "0.991445 -0.130526 0 1" },
    { x: 162.0, y: 554.9, m: "0.991445 -0.130526 0 1" },
    { x: 175.8, y: 553.1, m: "0.991445 -0.130526 0 1" },
  ],
  1: [
    { x: 417.4, y: 530.5, m: "0.999229 -0.0392598 0 1" },
    { x: 431.3, y: 530.0, m: "0.999229 -0.0392598 0 1" },
    { x: 445.2, y: 529.4, m: "0.999229 -0.0392598 0 1" },
    { x: 459.1, y: 528.9, m: "0.999229 -0.0392598 0 1" },
  ],
  2: [
    { x: 715.0, y: 518.5, m: "1 0 0 1" },
    { x: 728.0, y: 518.5, m: "1 0 0 1" },
    { x: 741.0, y: 518.5, m: "1 0 0 1" },
    { x: 754.0, y: 518.5, m: "1 0 0 1" },
  ],
  3: [
    { x: 989.4, y: 528.5, m: "0.99863 0.052336 0 1" },
    { x: 1003.3, y: 529.2, m: "0.99863 0.052336 0 1" },
    { x: 1017.2, y: 530.0, m: "0.99863 0.052336 0 1" },
    { x: 1031.1, y: 530.7, m: "0.99863 0.052336 0 1" },
  ],
  4: [
    { x: 1268.4, y: 551.5, m: "0.993068 0.117537 0 1" },
    { x: 1282.2, y: 553.1, m: "0.993068 0.117537 0 1" },
    { x: 1296.1, y: 554.8, m: "0.993068 0.117537 0 1" },
    { x: 1309.9, y: 556.4, m: "0.993068 0.117537 0 1" },
  ],
};

const asset = (name: string) =>
  new URL(`../../assets/home/${name}`, import.meta.url).href;

export default function HierarchyStage({
  onActiveChange,
}: {
  onActiveChange?: (active: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { translation } = useTranslation();
  const langContent = useLanguageStore((state) => state.content);
  const currentLang = useLanguageStore((state) => state.currentLang);
  const html = useMemo(
    () =>
      stageSvg.replace(/assets\/([\w.-]+)/g, (_m, name: string) => asset(name)),
    [],
  );

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.innerHTML = html;
    root.querySelectorAll("text").forEach((node) => {
      const en = node.textContent?.trim() ?? "";
      const key = SVG_LABELS[en];
      if (key) node.textContent = translation(`home-page.${key}`, en);
    });
    const groups = Array.from(
      root.querySelectorAll<SVGGElement>(".hier-char-group"),
    );

    const apply = (hovered: number | null) => {
      onActiveChange?.(hovered !== null);
      groups.forEach((g) => {
        const idx = Number(g.getAttribute("data-char-idx"));
        const portrait = g.querySelector(".hier-portrait-layer");
        const dots = g.querySelector(".hier-peer-dots");

        g.classList.remove("is-active", "is-locked");
        portrait?.removeAttribute("filter");
        if (dots) {
          dots.classList.remove("is-shown");
          dots.innerHTML = "";
        }
        if (hovered === null) return;

        const state = MATRIX[hovered][idx];
        if (state === "active") {
          g.classList.add("is-active");
        } else if (state === "locked") {
          g.classList.add("is-locked");
          portrait?.setAttribute("filter", "url(#hier-portrait-blur)");
        } else if (Array.isArray(state) && dots) {
          const coords = DOT_COORDS[idx] ?? [];
          const offset = state.length <= 2 && state.length > 0 ? 1 : 0;
          dots.innerHTML = state
            .map((color, i) => {
              const pt = coords[Math.min(offset + i, coords.length - 1)];
              return `<rect width="10.086" height="10" rx="3" transform="matrix(${pt.m} ${pt.x} ${pt.y})" fill="${color}"/>`;
            })
            .join("");
          dots.classList.add("is-shown");
        }
      });
    };

    const cleanups: (() => void)[] = [];
    groups.forEach((g) => {
      const idx = Number(g.getAttribute("data-char-idx"));
      const enter = () => apply(idx);
      const leave = () => apply(null);
      const click = (e: Event) => {
        e.stopPropagation();
        apply(g.classList.contains("is-active") ? null : idx);
      };
      g.addEventListener("mouseenter", enter);
      g.addEventListener("mouseleave", leave);
      g.addEventListener("click", click);
      cleanups.push(() => {
        g.removeEventListener("mouseenter", enter);
        g.removeEventListener("mouseleave", leave);
        g.removeEventListener("click", click);
      });
    });

    const outside = (e: MouseEvent) => {
      if (!root.contains(e.target as Node)) apply(null);
    };
    document.addEventListener("click", outside);
    cleanups.push(() => document.removeEventListener("click", outside));

    return () => cleanups.forEach((fn) => fn());
  }, [html, onActiveChange, currentLang, langContent]);

  return <div ref={ref} className={classes.hierStage} />;
}
