export default function ProgressBar({ value = 0, showLabel = true, status }) {
  const pct = Math.max(0, Math.min(100, value))
  const fillClass = status === 'done' ? 'done' : status === 'repair' ? 'repair' : ''

  return (
    <div className="progress-wrap">
      {showLabel && (
        <div className="progress-label-row">
          <span>Progreso</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
