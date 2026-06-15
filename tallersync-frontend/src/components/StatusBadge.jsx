const WO_LABELS = {
  waiting:   'En Espera',
  diagnosis: 'Diagnóstico',
  repair:    'En Reparación',
  testing:   'En Pruebas',
  done:      'Finalizado'
}

const APT_LABELS = {
  pending:  'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada'
}

const QUOTE_LABELS = {
  draft:    'Borrador',
  sent:     'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada'
}

export default function StatusBadge({ status, type = 'work_order' }) {
  let label = status
  if (type === 'work_order')   label = WO_LABELS[status]    || status
  if (type === 'appointment')  label = APT_LABELS[status]   || status
  if (type === 'quote')        label = QUOTE_LABELS[status] || status

  return <span className={`badge badge-${status}`}>{label}</span>
}
