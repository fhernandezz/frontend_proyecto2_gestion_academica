import { useState } from 'react'
import Alerta from '../../components/Alerta'
import { claseCampo, erroresDelServidor } from './utilidades'

export default function PeriodoForm({ periodo, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    nombre: periodo?.nombre ?? '',
    fecha_inicio: periodo?.fecha_inicio ?? '',
    fecha_fin: periodo?.fecha_fin ?? '',
    activo: periodo?.activo ?? true,
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [procesando, setProcesando] = useState(false)

  // El checkbox usa "checked" en vez de "value"
  function manejarCambio(e) {
    const { name, type, value, checked } = e.target
    setFormulario({ ...formulario, [name]: type === 'checkbox' ? checked : value })
  }

  function validar() {
    const nuevos = {}
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.'
    if (!formulario.fecha_inicio) nuevos.fecha_inicio = 'Indique la fecha de inicio.'
    if (!formulario.fecha_fin) nuevos.fecha_fin = 'Indique la fecha de fin.'
    // Las fechas "AAAA-MM-DD" se pueden comparar como texto
    if (formulario.fecha_inicio && formulario.fecha_fin && formulario.fecha_fin < formulario.fecha_inicio) {
      nuevos.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio.'
    }
    return nuevos
  }

  async function manejarEnvio(e) {
    e.preventDefault()
    setErrorGeneral('')
    const nuevosErrores = validar()
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    try {
      setProcesando(true)
      await onGuardar({ ...formulario, nombre: formulario.nombre.trim() })
    } catch (err) {
      const { campos, general } = erroresDelServidor(err)
      setErrores(campos)
      setErrorGeneral(general)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white fw-semibold">{periodo ? 'Editar período' : 'Nuevo período'}</div>
      <div className="card-body">
        <Alerta tipo="danger" mensaje={errorGeneral} />
        <form onSubmit={manejarEnvio} noValidate>
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="nombre" className="form-label">
                Nombre *
              </label>
              <input
                id="nombre"
                name="nombre"
                className={claseCampo(errores, 'nombre')}
                value={formulario.nombre}
                onChange={manejarCambio}
                maxLength={50}
                placeholder="Ej: II-2026"
                required
              />
              <div className="invalid-feedback">{errores.nombre}</div>
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="fecha_inicio" className="form-label">
                Fecha de inicio *
              </label>
              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                className={claseCampo(errores, 'fecha_inicio')}
                value={formulario.fecha_inicio}
                onChange={manejarCambio}
                required
              />
              <div className="invalid-feedback">{errores.fecha_inicio}</div>
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="fecha_fin" className="form-label">
                Fecha de fin *
              </label>
              <input
                id="fecha_fin"
                name="fecha_fin"
                type="date"
                className={claseCampo(errores, 'fecha_fin')}
                value={formulario.fecha_fin}
                onChange={manejarCambio}
                required
              />
              <div className="invalid-feedback">{errores.fecha_fin}</div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  id="activo"
                  name="activo"
                  type="checkbox"
                  className="form-check-input"
                  checked={formulario.activo}
                  onChange={manejarCambio}
                />
                <label htmlFor="activo" className="form-check-label">
                  Activo
                </label>
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? 'Guardando...' : periodo ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={procesando}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
