import { useState } from 'react'
import Alerta from '../../components/Alerta'
import { claseCampo, erroresDelServidor } from './utilidades'

export default function GrupoForm({ grupo, cursos, periodos, profesores, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    curso: grupo ? String(grupo.curso) : '',
    periodo: grupo ? String(grupo.periodo) : '',
    numero_grupo: grupo?.numero_grupo ?? 1,
    profesor: grupo?.profesor ? String(grupo.profesor) : '',
    cupo_maximo: grupo?.cupo_maximo ?? 30,
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [procesando, setProcesando] = useState(false)

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  function validar() {
    const nuevos = {}
    if (!formulario.curso) nuevos.curso = 'Seleccione un curso.'
    if (!formulario.periodo) nuevos.periodo = 'Seleccione un período.'
    if (!formulario.numero_grupo || Number(formulario.numero_grupo) < 1) {
      nuevos.numero_grupo = 'El número de grupo debe ser mayor que cero.'
    }
    if (!formulario.cupo_maximo || Number(formulario.cupo_maximo) < 1) {
      nuevos.cupo_maximo = 'El cupo debe ser de al menos 1 estudiante.'
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
        curso: Number(formulario.curso),
        periodo: Number(formulario.periodo),
        numero_grupo: Number(formulario.numero_grupo),
        // El backend acepta null si el grupo todavía no tiene profesor
        profesor: formulario.profesor ? Number(formulario.profesor) : null,
        cupo_maximo: Number(formulario.cupo_maximo),
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
      <div className="card-header bg-white fw-semibold">{grupo ? 'Editar grupo' : 'Nuevo grupo'}</div>
      <div className="card-body">
        <Alerta tipo="danger" mensaje={errorGeneral} />
        <form onSubmit={manejarEnvio} noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="curso" className="form-label">
                Curso *
              </label>
              <select
                id="curso"
                name="curso"
                className={claseCampo(errores, 'curso', 'form-select')}
                value={formulario.curso}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccione...</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.codigo} - {curso.nombre}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.curso}</div>
            </div>
            <div className="col-md-6">
              <label htmlFor="periodo" className="form-label">
                Período *
              </label>
              <select
                id="periodo"
                name="periodo"
                className={claseCampo(errores, 'periodo', 'form-select')}
                value={formulario.periodo}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccione...</option>
                {periodos.map((periodo) => (
                  <option key={periodo.id} value={periodo.id}>
                    {periodo.nombre} {periodo.activo ? '' : '(inactivo)'}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.periodo}</div>
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="numero_grupo" className="form-label">
                Número de grupo *
              </label>
              <input
                id="numero_grupo"
                name="numero_grupo"
                type="number"
                min={1}
                className={claseCampo(errores, 'numero_grupo')}
                value={formulario.numero_grupo}
                onChange={manejarCambio}
                required
              />
              <div className="invalid-feedback">{errores.numero_grupo}</div>
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="cupo_maximo" className="form-label">
                Cupo máximo *
              </label>
              <input
                id="cupo_maximo"
                name="cupo_maximo"
                type="number"
                min={1}
                className={claseCampo(errores, 'cupo_maximo')}
                value={formulario.cupo_maximo}
                onChange={manejarCambio}
                required
              />
              <div className="invalid-feedback">{errores.cupo_maximo}</div>
            </div>
            <div className="col-md-6">
              <label htmlFor="profesor" className="form-label">
                Profesor
              </label>
              <select
                id="profesor"
                name="profesor"
                className={claseCampo(errores, 'profesor', 'form-select')}
                value={formulario.profesor}
                onChange={manejarCambio}
              >
                <option value="">Sin asignar</option>
                {profesores.map((profesor) => (
                  <option key={profesor.id} value={profesor.id}>
                    {profesor.nombre}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.profesor}</div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? 'Guardando...' : grupo ? 'Actualizar' : 'Guardar'}
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
