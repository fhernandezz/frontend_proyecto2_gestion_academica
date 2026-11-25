import { useEffect, useState } from 'react'
import Alerta from '../../components/Alerta'
import Cargando from '../../components/Cargando'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'
import EncabezadoPagina from '../../components/EncabezadoPagina'
import EstadoVacio from '../../components/EstadoVacio'
import Paginacion from '../../components/Paginacion'
import { useAuth } from '../../context/AuthContext'
import { api, obtenerResultados } from '../../services/api'
import EvaluacionForm from './EvaluacionForm'
import { nombreGrupo } from './utilidades'

const TAMANO_PAGINA = 10

export default function Evaluaciones() {
  const { perfil, esAdmin, esProfesor } = useAuth()

  const [evaluaciones, setEvaluaciones] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [grupos, setGrupos] = useState([])
  const [grupoFiltro, setGrupoFiltro] = useState('')

  // Resultado de GET /califica/{grupo}/validar-porcentajes/
  const [validacion, setValidacion] = useState(null)
  const [validando, setValidando] = useState(false)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [evaluacionEditando, setEvaluacionEditando] = useState(null)
  const [evaluacionEliminar, setEvaluacionEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  // El backend deja gestionar al admin o al profesor del grupo
  const puedeGestionar = esAdmin || esProfesor

  useEffect(() => {
    let activo = true
    async function cargarGrupos() {
      try {
        const datos = await api.get('/academico/grupos/', { page_size: 50 })
        if (activo) setGrupos(obtenerResultados(datos))
      } catch {
        if (activo) setGrupos([])
      }
    }
    cargarGrupos()
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    let activo = true
    async function cargarEvaluaciones() {
      try {
        setCargando(true)
        setError('')
        const datos = await api.get('/evaluaciones/', {
          grupo: grupoFiltro,
          page: pagina,
          page_size: TAMANO_PAGINA,
        })
        if (!activo) return
        setEvaluaciones(obtenerResultados(datos))
        setTotal(datos.count ?? 0)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarEvaluaciones()
    return () => {
      activo = false
    }
  }, [grupoFiltro, pagina, recargar])

  async function validarPorcentajes() {
    try {
      setValidando(true)
      setError('')
      const datos = await api.get(`/califica/${grupoFiltro}/validar-porcentajes/`)
      setValidacion(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setValidando(false)
    }
  }

  function abrirNuevo() {
    setEvaluacionEditando(null)
    setMostrarFormulario(true)
    setMensaje('')
  }

  function abrirEdicion(evaluacion) {
    setEvaluacionEditando(evaluacion)
    setMostrarFormulario(true)
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setEvaluacionEditando(null)
  }

  async function guardarEvaluacion(datos) {
    if (evaluacionEditando) {
      await api.patch(`/evaluaciones/${evaluacionEditando.id}/`, datos)
      setMensaje('Evaluación actualizada correctamente.')
    } else {
      await api.post('/evaluaciones/', datos)
      setMensaje('Evaluación creada correctamente.')
    }
    cerrarFormulario()
    setValidacion(null)
    setRecargar((valor) => valor + 1)
  }

  async function confirmarEliminacion() {
    try {
      setEliminando(true)
      await api.eliminar(`/evaluaciones/${evaluacionEliminar.id}/`)
      setMensaje('Evaluación eliminada correctamente.')
      setValidacion(null)
      if (evaluaciones.length === 1 && pagina > 1) {
        setPagina(pagina - 1)
      } else {
        setRecargar((valor) => valor + 1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminando(false)
      setEvaluacionEliminar(null)
    }
  }

  // El profesor solo puede crear evaluaciones en los grupos que imparte
  const gruposFormulario = esProfesor ? grupos.filter((g) => g.profesor === perfil?.user?.id) : grupos
  const acumulado = validacion ? Number(validacion.porcentaje_acumulado) : 0

  return (
    <>
      <EncabezadoPagina titulo="Evaluaciones" descripcion="Rubros de evaluación de cada grupo y su porcentaje.">
        {puedeGestionar && !mostrarFormulario && (
          <button className="btn btn-primary" onClick={abrirNuevo}>
            Nueva evaluación
          </button>
        )}
      </EncabezadoPagina>

      <Alerta tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />

      {mostrarFormulario && (
        <EvaluacionForm
          key={evaluacionEditando?.id ?? 'nueva'}
          evaluacion={evaluacionEditando}
          grupos={gruposFormulario}
          grupoInicial={grupoFiltro}
          onGuardar={guardarEvaluacion}
          onCancelar={cerrarFormulario}
        />
      )}

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-6">
              <label htmlFor="filtro-grupo" className="form-label small">
                Grupo
              </label>
              <select
                id="filtro-grupo"
                className="form-select form-select-sm"
                value={grupoFiltro}
                onChange={(e) => {
                  setGrupoFiltro(e.target.value)
                  setPagina(1)
                  // Al cambiar de grupo, la validación anterior ya no sirve
                  setValidacion(null)
                }}
              >
                <option value="">Todos</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {nombreGrupo(grupo)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={validarPorcentajes}
                disabled={!grupoFiltro || validando}
                title={grupoFiltro ? '' : 'Primero seleccione un grupo'}
              >
                {validando ? 'Validando...' : 'Validar porcentajes del grupo'}
              </button>
            </div>
          </div>

          {validacion && (
            <div className="mt-3">
              <div className="progress" role="progressbar" aria-valuenow={acumulado} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={`progress-bar ${validacion.valido ? 'bg-success' : 'bg-warning'}`}
                  style={{ width: `${Math.min(acumulado, 100)}%` }}
                >
                  {validacion.porcentaje_acumulado}%
                </div>
              </div>
              <small className={validacion.valido ? 'text-success' : 'text-secondary'}>
                {validacion.valido
                  ? 'Las evaluaciones del grupo suman exactamente 100%.'
                  : `Faltan ${validacion.porcentaje_faltante}% para completar el 100%.`}
              </small>
            </div>
          )}
        </div>
      </div>

      <Alerta tipo="danger" mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando evaluaciones..." />
      ) : evaluaciones.length === 0 ? (
        <EstadoVacio
          mensaje={grupoFiltro ? 'Este grupo todavía no tiene evaluaciones.' : 'Todavía no hay evaluaciones registradas.'}
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white mb-0">
              <thead className="table-light">
                <tr>
                  <th>Evaluación</th>
                  <th>Grupo</th>
                  <th>Porcentaje</th>
                  {puedeGestionar && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {evaluaciones.map((evaluacion) => (
                  <tr key={evaluacion.id}>
                    <td className="fw-semibold">{evaluacion.nombre}</td>
                    <td>{evaluacion.grupo_detalle}</td>
                    <td>{Number(evaluacion.porcentaje)}%</td>
                    {puedeGestionar && (
                      <td className="text-end text-nowrap">
                        <button className="btn btn-outline-primary btn-sm me-2" onClick={() => abrirEdicion(evaluacion)}>
                          Editar
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => setEvaluacionEliminar(evaluacion)}>
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={pagina} tamano={TAMANO_PAGINA} total={total} onCambiar={setPagina} />
        </>
      )}

      <ConfirmarEliminar
        visible={Boolean(evaluacionEliminar)}
        mensaje={
          evaluacionEliminar &&
          `¿Desea eliminar la evaluación "${evaluacionEliminar.nombre}"? También se borrarán las notas registradas en ella.`
        }
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setEvaluacionEliminar(null)}
      />
    </>
  )
}
