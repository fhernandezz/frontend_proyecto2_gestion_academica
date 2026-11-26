import { useState } from 'react'
import Alerta from '../../components/Alerta'
import { ESTADOS_MATRICULA, claseCampo, erroresDelServidor, nombreGrupo } from '../calificaciones/utilidades'

// El admin elige estudiante, grupo y estado.
// El estudiante solo elige el grupo: Django le asigna su propio usuario.
export default function MatriculaForm({ matricula, esAdmin, estudiantes, grupos, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    estudiante: matricula ? String(matricula.estudiante) : '',
    grupo: matricula ? String(matricula.grupo) : '',
    estado: matricula?.estado ?? 'MATRICULADO',
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [procesando, setProcesando] = useState(false)

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  function validar() {
    const nuevos = {}
    if (esAdmin && !formulario.estudiante) nuevos.estudiante = 'Seleccione un estudiante.'
    if (!formulario.grupo) nuevos.grupo = 'Seleccione un grupo.'
    return nuevos
  }

  async function manejarEnvio(e) {
    e.preventDefault()
    setErrorGeneral('')
    const nuevosErrores = validar()
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = esAdmin
      ? { estudiante: Number(formulario.estudiante), grupo: Number(formulario.grupo), estado: formulario.estado }
      : { grupo: Number(formulario.grupo) }

    try {
      setProcesando(true)
      await onGuardar(datos)
    } catch (err) {
      // Aquí llegan las reglas del backend: cupo lleno, prerrequisitos, choque de horario...
      const { campos, general } = erroresDelServidor(err)
      setErrores(campos)
      setErrorGeneral(general)
    } finally {
      setProcesando(false)
    }
  }

  const titulo = matricula ? 'Editar matrícula' : esAdmin ? 'Nueva matrícula' : 'Solicitar matrícula'

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white fw-semibold">{titulo}</div>
      <div className="card-body">
        <Alerta tipo="danger" mensaje={errorGeneral} />
        <form onSubmit={manejarEnvio} noValidate>
          <div className="row g-3">
            {esAdmin && (
              <div className="col-md-4">
                <label htmlFor="estudiante" className="form-label">
                  Estudiante *
                </label>
                <select
                  id="estudiante"
                  name="estudiante"
                  className={claseCampo(errores, 'estudiante', 'form-select')}
                  value={formulario.estudiante}
                  onChange={manejarCambio}
                  required
                >
                  <option value="">Seleccione...</option>
                  {estudiantes.map((estudiante) => (
                    <option key={estudiante.id} value={estudiante.id}>
                      {estudiante.nombre}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">{errores.estudiante}</div>
              </div>
            )}
            <div className={esAdmin ? 'col-md-5' : 'col-md-8'}>
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
                    {nombreGrupo(grupo)} · cupo {grupo.cupo_maximo}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.grupo}</div>
            </div>
            {esAdmin && (
              <div className="col-md-3">
                <label htmlFor="estado" className="form-label">
                  Estado *
                </label>
                <select
                  id="estado"
                  name="estado"
                  className={claseCampo(errores, 'estado', 'form-select')}
                  value={formulario.estado}
                  onChange={manejarCambio}
                >
                  {ESTADOS_MATRICULA.map((estado) => (
                    <option key={estado.valor} value={estado.valor}>
                      {estado.texto}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">{errores.estado}</div>
              </div>
            )}
          </div>
          {!esAdmin && (
            <p className="text-secondary small mt-3 mb-0">
              El sistema revisa el cupo, los prerrequisitos del curso y que el horario no choque con sus otras
              matrículas.
            </p>
          )}
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? 'Enviando...' : matricula ? 'Actualizar' : esAdmin ? 'Guardar' : 'Matricularme'}
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
