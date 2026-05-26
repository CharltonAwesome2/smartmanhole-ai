/**
 * Thin wrapper so icon size and alignment stay consistent app-wide.
 * Usage: <Icon as={HiOutlineMap} size={18} />
 */
export default function Icon({ as: Component, size = 18, className = "", ...props }) {
  if (!Component) return null;

  return <Component size={size} className={className} aria-hidden {...props} />;
}
