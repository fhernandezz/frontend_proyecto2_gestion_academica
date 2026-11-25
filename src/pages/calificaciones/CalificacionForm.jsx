import { useState } from 'react'
import Alerta from '../../components/Alerta'
import { claseCampo, erroresDelServidor } from './utilidades'

export default function CalificacionForm({ calificacion, matriculas, evaluaciones, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    matricula: calificacion ? String(calificacion.matricula) : '',
    evaluacion: calificacion ? String(calificacion.evaluacion) : '',
    nota_obtenida: calificacion?.nota_obtenida ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [procesando, setProcesando] = useState(false)

  function manejarCambio(e) {
    const { name, value } = e.target
    if (name === 'matricula') {
      // Al cambiar de estudiante, la evaluación elegida puede ser de otro grupo
      setFormulario({ ...formulario, matricula: value, evaluacion: '' })
    } else {
      setFormulario({ ...formulario, [name]: value })
    }
  }

  // Solo mostramos las evaluaciones del grupo de la matrícula elegida
  const matriculaElegida = matriculas.find((m) => String(m.id) === formulario.matricula)
  const evaluacionesDelGrupo = matriculaElegida
    ? evaluaciones.filter((ev) => ev.grupo === matriculaElegida.grupo)
    : []

  function validar() {
    const nuevos = {}
    const nota = Number(formulario.nota_obtenida)
    if (!formulario.matricula) nuevos.matricula = 'Seleccione el estudiante.'
    if (!formulario.evaluacion) nuevos.evaluacion = 'Seleccione la evaluación.'
    if (formulario.nota_obtenida === '' || nota < 0 || nota > 100) {
      nuevos.nota_obtenida = 'La nota debe estar entre 0 y 100.'
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
        matricula: Number(formulario.matricula),
        evaluacion: Number(formulario.evaluacion),
        nota_obtenida: formulario.nota_obtenida,
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
      <div className="card-header bg-white fw-semibold">{calificacion ? 'Editar nota' : 'Registrar nota'}</div>
      <div className="card-body">
        <Alerta tipo="danger" mensaje={errorGeneral} />
        <form onSubmit={manejarEnvio} noValidate>
          <div className="row g-3">
            <div className="col-md-5">
              <label htmlFor="matricula" className="form-label">
                Estudiante (matrícula) *
              </label>
              <select
                id="matricula"
                name="matricula"
                className={claseCampo(errores, 'matricula', 'form-select')}
                value={formulario.matricula}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccione...</option>
                {matriculas.map((matricula) => (
                  <option key={matricula.id} value={matricula.id}>
                    {matricula.estudiante_username} — {matricula.grupo_detalle}
                    {matricula.estado === 'RETIRADO' ? ' (retirado)' : ''}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.matricula}</div>
            </div>
            <div className="col-md-4">
              <label htmlFor="evaluacion" className="form-label">
                Evaluación *
              </label>
              <select
                id="evaluacion"
                name="evaluacion"
                className={claseCampo(errores, 'evaluacion', 'form-select')}
                value={formulario.evaluacion}
                onChange={manejarCambio}
                disabled={!formulario.matricula}
                required
              >
                <option value="">{formulario.matricula ? 'Seleccione...' : 'Primero elija el estudiante'}</option>
                {evaluacionesDelGrupo.map((evaluacion) => (
                  <option key={evaluacion.id} value={evaluacion.id}>
                    {evaluacion.nombre} ({Number(evaluacion.porcentaje)}%)
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.evaluacion}</div>
              {formulario.matricula && evaluacionesDelGrupo.length === 0 && (
                <small className="text-secondary">Ese grupo todavía no tiene evaluaciones.</small>
              )}
            </div>
            <div className="col-md-3">
              <label htmlFor="nota_obtenida" className="form-label">
                Nota (0-100) *
              </label>
              <input
                id="nota_obtenida"
                name="nota_obtenida"
                type="number"
                min={0}
                max={100}
                step={0.01}
                className={claseCampo(errores, 'nota_obtenida')}
                value={formulario.nota_obtenida}
                onChange={manejarCambio}
                required
              />
              <div className="invalid-feedback">{errores.nota_obtenida}</div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? 'Guardando...' : calificacion ? 'Actualizar' : 'Guardar'}
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
