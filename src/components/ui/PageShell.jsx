import styles from "./PageShell.module.css";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function PageShell({ children, className = "" }) {
  return <section className={join(styles.shell, className)}>{children}</section>;
}

export function PageGrid({ children, columns = 2, className = "" }) {
  const columnClass =
    columns === 4 ? styles["grid--4"] : columns === "map" ? styles["grid--map"] : styles["grid--2"];

  return <div className={join(styles.grid, columnClass, className)}>{children}</div>;
}

export function MapPane({ children, className = "" }) {
  return <div className={join(styles.mapPane, className)}>{children}</div>;
}
