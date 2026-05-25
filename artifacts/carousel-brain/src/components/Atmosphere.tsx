/**
 * Calm, fixed atmospheric layer — subtle drift only, never distracts.
 */
export function Atmosphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 mesh-bg mesh-bg-live opacity-100" />
      <div className="atmosphere-orb atmosphere-orb-a" />
      <div className="atmosphere-orb atmosphere-orb-b" />
      <div className="atmosphere-orb atmosphere-orb-c" />
    </div>
  );
}
