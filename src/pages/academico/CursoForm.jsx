import { useState } from 'react'
import Alerta from '../../components/Alerta'
import { claseCampo, erroresDelServidor } from './utilidades'

// todosLosCursos se usa para elegir los prerrequisitos
export default function CursoForm({ curso, carreras, todosLosCursos, onGuardar, onCancelar }) {
  const [formulario, setFormulario] = useState({
    codigo: curso?.codigo ?? '',
    nombre: curso?.nombre ?? '',
    creditos: curso?.creditos ?? '',
    carrera: curso ? String(curso.carrera) : '',
    prerrequisitos: curso?.prerrequisitos ?? [],
  })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [procesando, setProcesando] = useState(false)

  function manejarCambio(e) {
    const { name, value } = e.target
    if (name === 'carrera') {
      // Si cambia la carrera, los prerrequisitos anteriores ya no aplican
      setFormulario({ ...formulario, carrera: value, prerrequisitos: [] })
    } else {
      setFormulario({ ...formulario, [name]: value })
    }
  }

  // Marca o desmarca un prerrequisito de la lista
  function alternarPrerrequisito(id) {
    const yaEsta = formulario.prerrequisitos.includes(id)
    setFormulario({
      ...formulario,
      prerrequisitos: yaEsta
        ? formulario.prerrequisitos.filter((p) => p !== id)
        : [...formulario.prerrequisitos, id],
    })
  }

  // Solo se ofrecen cursos de la misma carrera y nunca el mismo curso
  const opcionesPrerrequisito = todosLosCursos.filter(
    (c) => String(c.carrera) === formulario.carrera && c.id !== curso?.id,
  )

  function validar() {
    const nuevos = {}
    if (!formulario.codigo.trim()) nuevos.codigo = 'El código es obligatorio.'
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.'
    if (!formulario.creditos || Number(formulario.creditos) < 1) nuevos.creditos = 'Debe tener al menos 1 crédito.'
    if (!formulario.carrera) nuevos.carrera = 'Seleccione una carrera.'
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
        creditos: Number(formulario.creditos),
        carrera: Number(formulario.carrera),
        prerrequisitos: formulario.prerrequisitos,
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
      <div className="card-header bg-white fw-semibold">{curso ? 'Editar curso' : 'Nuevo curso'}</div>
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
                placeholder="Ej: IF0009"
                required
              />
              <div className="invalid-feedback">{errores.codigo}</div>
            </div>
            <div className="col-md-6">
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
            <div className="col-md-3">
              <label htmlFor="creditos" className="form-label">
                Créditos *
              </label>
              <input
                id="creditos"
                name="creditos"
                type="number"
                min={1}
                className={claseCampo(errores, 'creditos')}
                value={formulario.creditos}
                onChange={manejarCambio}
                required
              />
              <div className="invalid-feedback">{errores.creditos}</div>
            </div>
            <div className="col-md-6">
              <label htmlFor="carrera" className="form-label">
                Carrera *
              </label>
              <select
                id="carrera"
                name="carrera"
                className={claseCampo(errores, 'carrera', 'form-select')}
                value={formulario.carrera}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccione...</option>
                {carreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>
                    {carrera.codigo} - {carrera.nombre}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">{errores.carrera}</div>
            </div>
            <div className="col-md-6">
              <span className="form-label d-block">Prerrequisitos</span>
              <div className={`border rounded p-2 ${errores.prerrequisitos ? 'border-danger' : ''}`} style={{ maxHeight: 160, overflowY: 'auto' }}>
                {!formulario.carrera ? (
                  <small className="text-secondary">Primero seleccione la carrera.</small>
                ) : opcionesPrerrequisito.length === 0 ? (
                  <small className="text-secondary">No hay otros cursos en esta carrera.</small>
                ) : (
                  opcionesPrerrequisito.map((opcion) => (
                    <div className="form-check" key={opcion.id}>
                      <input
                        id={`pre-${opcion.id}`}
                        type="checkbox"
                        className="form-check-input"
                        checked={formulario.prerrequisitos.includes(opcion.id)}
                        onChange={() => alternarPrerrequisito(opcion.id)}
                      />
                      <label htmlFor={`pre-${opcion.id}`} className="form-check-label">
                        {opcion.codigo} - {opcion.nombre}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {errores.prerrequisitos && <div className="text-danger small mt-1">{errores.prerrequisitos}</div>}
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? 'Guardando...' : curso ? 'Actualizar' : 'Guardar'}
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
