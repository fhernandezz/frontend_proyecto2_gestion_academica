import { useState } from 'react'
import Alerta from '../../components/Alerta'
import { claseCampo, erroresDelServidor, nombreGrupo } from './utilidades'

export default function EvaluacionForm({ evaluacion, grupos, grupoInicial, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    grupo: evaluacion ? String(evaluacion.grupo) : grupoInicial,
    nombre: evaluacion?.nombre ?? '',
    porcentaje: evaluacion?.porcentaje ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [procesando, setProcesando] = useState(false)

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  function validar() {
    const nuevos = {}
    const porcentaje = Number(formulario.porcentaje)
    if (!formulario.grupo) nuevos.grupo = 'Seleccione un grupo.'
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.'
    if (formulario.porcentaje === '' || porcentaje <= 0 || porcentaje > 100) {
      nuevos.porcentaje = 'El porcentaje debe ser mayor que 0 y máximo 100.'
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
      await onGuardar({
        grupo: Number(formulario.grupo),
        nombre: formulario.nombre.trim(),
        porcentaje: formulario.porcentaje,
      })
    } catch (err) {
      // Si la suma del grupo pasa de 100%, Django lo avisa en "porcentaje"
      const { campos, general } = erroresDelServidor(err)
      setErrores(campos)
      setErrorGeneral(general)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white fw-semibold">{evaluacion ? 'Editar evaluación' : 'Nueva evaluación'}</div>
      <div className="card-body">
        <Alerta tipo="danger" mensaje={errorGeneral} />
        <form onSubmit={manejarEnvio} noValidate>
          <div className="row g-3">
            <div className="col-md-5">
              <label htmlFor="grupo" className="form-label">
                Grupo *
              </label>
              <select
                id="grupo"
                name="grupo"
                className={claseCampo(errores, 'grupo', 'form-select')}
                value={formulario.grupo}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccione...</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {nombreGrupo(grupo)}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.grupo}</div>
            </div>
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
                placeholder="Ej: Examen parcial"
                required
              />
              <div className="invalid-feedback">{errores.nombre}</div>
            </div>
            <div className="col-md-3">
              <label htmlFor="porcentaje" className="form-label">
                Porcentaje (%) *
              </label>
              <input
                id="porcentaje"
                name="porcentaje"
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                className={claseCampo(errores, 'porcentaje')}
                value={formulario.porcentaje}
                onChange={manejarCambio}
                required
              />
              <div className="invalid-feedback">{errores.porcentaje}</div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? 'Guardando...' : evaluacion ? 'Actualizar' : 'Guardar'}
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
