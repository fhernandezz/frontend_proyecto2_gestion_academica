import { useState } from 'react'
import Alerta from '../../components/Alerta'
import { claseCampo, erroresDelServidor } from './utilidades'

export default function CarreraForm({ carrera, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    codigo: carrera?.codigo ?? '',
    nombre: carrera?.nombre ?? '',
    descripcion: carrera?.descripcion ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [procesando, setProcesando] = useState(false)

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  function validar() {
    const nuevos = {}
    if (!formulario.codigo.trim()) nuevos.codigo = 'El código es obligatorio.'
    if (formulario.codigo.trim().length > 10) nuevos.codigo = 'El código admite máximo 10 caracteres.'
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.'
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
      await onGuardar({
        codigo: formulario.codigo.trim().toUpperCase(),
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
      })
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
      <div className="card-header bg-white fw-semibold">{carrera ? 'Editar carrera' : 'Nueva carrera'}</div>
      <div className="card-body">
        <Alerta tipo="danger" mensaje={errorGeneral} />
        <form onSubmit={manejarEnvio} noValidate>
          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="codigo" className="form-label">
                Código *
              </label>
              <input
                id="codigo"
                name="codigo"
                className={claseCampo(errores, 'codigo')}
                value={formulario.codigo}
                onChange={manejarCambio}
                maxLength={10}
                placeholder="Ej: IE"
                required
              />
              <div className="invalid-feedback">{errores.codigo}</div>
            </div>
            <div className="col-md-9">
              <label htmlFor="nombre" className="form-label">
                Nombre *
              </label>
              <input
                id="nombre"
                name="nombre"
                className={claseCampo(errores, 'nombre')}
                value={formulario.nombre}
                onChange={manejarCambio}
                maxLength={100}
                required
              />
              <div className="invalid-feedback">{errores.nombre}</div>
            </div>
            <div className="col-12">
              <label htmlFor="descripcion" className="form-label">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={2}
                className={claseCampo(errores, 'descripcion')}
                value={formulario.descripcion}
                onChange={manejarCambio}
              />
              <div className="invalid-feedback">{errores.descripcion}</div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? 'Guardando...' : carrera ? 'Actualizar' : 'Guardar'}
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
