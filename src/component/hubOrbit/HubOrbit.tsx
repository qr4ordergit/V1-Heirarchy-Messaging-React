import classes from "./HubOrbit.module.css";

const ORBIT_LABELS = ["JW", "JP", "JS", "JD"];
const PALETTE = ["#4B3FF2", "#17B890", "#FF6B4A", "#3F8CFF"];

export default function HubOrbit() {
  return (
    <div className={classes.orbitWrap}>
      <div className={classes.orbitRing}>
        {ORBIT_LABELS.map((label, i) => (
          <div
            key={label}
            className={classes.orbitPos}
            style={{ transform: `rotate(${i * 90}deg) translate(78px)` }}
          >
            <div className={classes.orbitCounter}>
              <div
                className={classes.orbitDot}
                style={{ background: PALETTE[i % PALETTE.length] }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={classes.orbitCore}>H</div>
    </div>
  );
}
