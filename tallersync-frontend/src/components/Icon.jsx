export default function Icon({ name, size = 16, style = {}, className = '' }) {
  return (
    <img
      src={`/icons/${name}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        filter: 'brightness(0) invert(1)',
        ...style,
      }}
    />
  )
}
