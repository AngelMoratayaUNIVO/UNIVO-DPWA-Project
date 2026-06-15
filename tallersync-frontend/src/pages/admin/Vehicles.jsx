import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import Icon from '../../components/Icon'

const EMPTY = { brand: '', model: '', year: '', plate: '', color: '' }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/vehicles')
      .then(res => setVehicles(res.data.vehicles || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setShowModal(true)
  }

  const openEdit = v => {
    setEditing(v)
    setForm({ brand: v.brand, model: v.model, year: v.year, plate: v.plate, color: v.color || '' })
    setError('')
    setShowModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form, year: Number(form.year) }
      if (editing) {
        await api.put(`/vehicles/${editing.id}`, payload)
      } else {
        await api.post('/vehicles', payload)
      }
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.message || 'Error al guardar vehículo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('¿Eliminar este vehículo?')) return
    try {
      await api.delete(`/vehicles/${id}`)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo eliminar')
    }
  }

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    return (
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      (v.owner?.full_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Gestión de Vehículos</h1>
          <p>Administra todos los vehículos registrados en el sistema</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Registrar Vehículo</button>
      </div>

      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por marca, modelo, placa o cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Icon name="icon-car" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
              <h4>Sin vehículos</h4>
              <p>{search ? 'No coincide ningún resultado.' : 'Registra el primer vehículo.'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Placa</th>
                  <th>Año</th>
                  <th>Color</th>
                  <th>Propietario</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.brand} {v.model}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: 'var(--surface)', padding: '2px 8px', borderRadius: 4 }}>
                        {v.plate}
                      </span>
                    </td>
                    <td className="td-muted">{v.year}</td>
                    <td className="td-muted">{v.color || '—'}</td>
                    <td>{v.owner?.full_name || '—'}</td>
                    <td className="td-muted">{v.owner?.phone || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar Vehículo' : 'Registrar Vehículo'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" form="form-vehicle" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form id="form-vehicle" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>Marca</label>
              <input
                type="text"
                className="form-control"
                placeholder="Toyota"
                value={form.brand}
                onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Corolla"
                value={form.model}
                onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Año</label>
              <input
                type="number"
                className="form-control"
                placeholder="2020"
                min="1950"
                max="2027"
                value={form.year}
                onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Placa</label>
              <input
                type="text"
                className="form-control"
                placeholder="P-123456"
                value={form.plate}
                onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <input
              type="text"
              className="form-control"
              placeholder="Rojo"
              value={form.color}
              onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </>
  )
}
