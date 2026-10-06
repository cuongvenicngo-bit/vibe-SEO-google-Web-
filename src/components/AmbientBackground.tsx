/** Fixed decorative backdrop: drifting aurora blobs, a sun glow by day and twinkling stars by night. */
export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="day-glow" />
      <div className="night-stars" />
      <div className="aurora-blob b1" />
      <div className="aurora-blob b2" />
      <div className="aurora-blob b3" />
      <div className="aurora-blob b4" />
    </div>
  );
}
