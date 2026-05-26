import styles from "./Card.module.css";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className = "",
  variant = "default",
  padding = "default",
  as: Component = "div",
  ...props
}) {
  const paddingClass =
    padding === "sm" ? styles["card--padding-sm"] : padding === "lg" ? styles["card--padding-lg"] : "";

  const variantClass = styles[`card--${variant}`] ?? "";

  return (
    <Component className={join(styles.card, variantClass, paddingClass, className)} {...props}>
      {children}
    </Component>
  );
}

export function CardBody({ children, className = "", relaxed = false }) {
  return (
    <div className={join(styles.cardBody, relaxed ? styles["cardBody--relaxed"] : "", className)}>{children}</div>
  );
}

export function StatCard({ label, value, hint, variant = "stat", valueSize = "default" }) {
  const statVariant = variant === "default" ? "stat" : variant;

  return (
    <Card variant={statVariant}>
      {label ? <p className={styles.statLabel}>{label}</p> : null}
      <strong className={join(styles.statValue, valueSize === "lg" ? styles["statValue--lg"] : "")}>{value}</strong>
      {hint ? <span className={styles.statHint}>{hint}</span> : null}
    </Card>
  );
}

export function CardEyebrow({ children }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

export function CardPanelHeader({ eyebrow, title, note, className = "" }) {
  return (
    <div className={join(styles.panelHeader, className)}>
      <div>
        {eyebrow ? <CardEyebrow>{eyebrow}</CardEyebrow> : null}
        {title ? <h3 className={styles.panelTitle}>{title}</h3> : null}
      </div>
      {note ? <span className={styles.panelNote}>{note}</span> : null}
    </div>
  );
}
