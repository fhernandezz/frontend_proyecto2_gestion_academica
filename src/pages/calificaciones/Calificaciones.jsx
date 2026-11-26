import { useEffect, useState } from 'react'
import Alerta from '../../components/Alerta'
import Cargando from '../../components/Cargando'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'
import EncabezadoPagina from '../../components/EncabezadoPagina'
import EstadoVacio from '../../components/EstadoVacio'
import Paginacion from '../../components/Paginacion'
import { useAuth } from '../../context/AuthContext'
import { api, obtenerResultados } from '../../services/api'
import CalificacionForm from './CalificacionForm'

const TAMANO_PAGINA = 10
const FILTROS_VACIOS = { matricula: '', evaluacion: '' }

export default function Calificaciones() {
  const { esAdmin, esProfesor, esEstudiante } = useAuth()

  const [calificaciones, setCalificaciones] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)

  // Matrículas y evaluaciones que el usuario puede ver (para filtros y formulario)
  const [matriculas, setMatriculas] = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [calificacionEditando, setCalificacionEditando] = useState(null)
  const [calificacionEliminar, setCalificacionEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  const puedeGestionar = esAdmin || esProfesor

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const [datosMatriculas, datosEvaluaciones] = await Promise.all([
          api.get('/matricula/', { page_size: 50 }),
          api.get('/evaluaciones/', { page_size: 50 }),
        ])
        if (!activo) return
        setMatriculas(obtenerResultados(datosMatriculas))
        setEvaluaciones(obtenerResultados(datosEvaluaciones))
      } catch {
        // Sin catálogos los selects quedan vacíos, pero la tabla sigue funcionando
      }
    }
    cargarCatalogos()
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    let activo = true
    async function cargarCalificaciones() {
      try {
        setCargando(true)
        setError('')
        const datos = await api.get('/calificaciones/', {
          ...filtros,
          page: pagina,
          page_size: TAMANO_PAGINA,
        })
        if (!activo) return
        setCalificaciones(obtenerResultados(datos))
        setTotal(datos.count ?? 0)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarCalificaciones()
    return () => {
      activo = false
    }
  }, [filtros, pagina, recargar])

  function manejarCambioFiltro(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
    setPagina(1)
  }

  // Datos extra que no vienen en la calificación: usuario y grupo
  function datosMatricula(id) {
    return matriculas.find((m) => m.id === id)
  }

  function abrirNuevo() {
    setCalificacionEditando(null)
    setMostrarFormulario(true)
    setMensaje('')
  }

  function abrirEdicion(calificacion) {
    setCalificacionEditando(calificacion)
    setMostrarFormulario(true)
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setCalificacionEditando(null)
  }

  async function guardarCalificacion(datos) {
    if (calificacionEditando) {
      await api.patch(`/calificaciones/${calificacionEditando.id}/`, datos)
      setMensaje('Nota actualizada correctamente.')
    } else {
      await api.post('/calificaciones/', datos)
      setMensaje('Nota registrada correctamente.')
    }
    cerrarFormulario()
    setRecargar((valor) => valor + 1)
  }

  async function confirmarEliminacion() {
    try {
      setEliminando(true)
      await api.eliminar(`/calificaciones/${calificacionEliminar.id}/`)
      setMensaje('Nota eliminada correctamente.')
      if (calificaciones.length === 1 && pagina > 1) {
        setPagina(pagina - 1)
      } else {
        setRecargar((valor) => valor + 1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminando(false)
      setCalificacionEliminar(null)
    }
  }

  const hayFiltros = filtros.matricula !== '' || filtros.evaluacion !== ''

  return (
    <>
      <EncabezadoPagina
        titulo={esEstudiante ? 'Mis calificaciones' : 'Calificaciones'}
        descripcion="Notas obtenidas por estudiante en cada evaluación."
      >
        {puedeGestionar && !mostrarFormulario && (
          <button className="btn btn-primary" onClick={abrirNuevo}>
            Registrar nota
          </button>
        )}
      </EncabezadoPagina>

      <Alerta tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />

      {mostrarFormulario && (
        <CalificacionForm
          key={calificacionEditando?.id ?? 'nueva'}
          calificacion={calificacionEditando}
          matriculas={matriculas}
          evaluaciones={evaluaciones}
          onGuardar={guardarCalificacion}
          onCancelar={cerrarFormulario}
        />
      )}

      {/* Filtros combinables del backend: ?matricula=&evaluacion= */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            {!esEstudiante && (
              <div className="col-md-5">
                <label htmlFor="filtro-matricula" className="form-label small">
                  Estudiante
                </label>
                <select
                  id="filtro-matricula"
                  name="matricula"
                  className="form-select form-select-sm"
                  value={filtros.matricula}
                  onChange={manejarCambioFiltro}
                >
                  <option value="">Todos</option>
                  {matriculas.map((matricula) => (
                    <option key={matricula.id} value={matricula.id}>
                      {matricula.estudiante_username} — {matricula.grupo_detalle}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-md-4">
              <label htmlFor="filtro-evaluacion" className="form-label small">
                Evaluación
              </label>
              <select
                id="filtro-evaluacion"
                name="evaluacion"
                className="form-select form-select-sm"
                value={filtros.evaluacion}
                onChange={manejarCambioFiltro}
              >
                <option value="">Todas</option>
                {evaluaciones.map((evaluacion) => (
                  <option key={evaluacion.id} value={evaluacion.id}>
                    {evaluacion.nombre} — {evaluacion.grupo_detalle}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() => {
                  setFiltros(FILTROS_VACIOS)
                  setPagina(1)
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <Alerta tipo="danger" mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando calificaciones..." />
      ) : calificaciones.length === 0 ? (
        <EstadoVacio
          mensaje={hayFiltros ? 'No hay notas con esos filtros.' : 'Todavía no hay notas registradas.'}
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white mb-0">
              <thead className="table-light">
                <tr>
                  {!esEstudiante && <th>Estudiante</th>}
                  <th>Grupo</th>
                  <th>Evaluación</th>
                  <th>Nota</th>
                  {puedeGestionar && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {calificaciones.map((calificacion) => {
                  const matricula = datosMatricula(calificacion.matricula)
                  const nota = Number(calificacion.nota_obtenida)
                  return (
                    <tr key={calificacion.id}>
                      {!esEstudiante && (
                        <td>{calificacion.estudiante_nombre || matricula?.estudiante_username || '—'}</td>
                      )}
                      <td>{matricula?.grupo_detalle ?? '—'}</td>
                      <td>{calificacion.evaluacion_nombre}</td>
                      <td>
                        {/* En verde si alcanza 70, que es la nota mínima para aprobar */}
                        <span className={`badge text-bg-${nota >= 70 ? 'success' : 'danger'}`}>{nota}</span>
                      </td>
                      {puedeGestionar && (
                        <td className="text-end text-nowrap">
                          <button className="btn btn-outline-primary btn-sm me-2" onClick={() => abrirEdicion(calificacion)}>
                            Editar
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setCalificacionEliminar(calificacion)}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={pagina} tamano={TAMANO_PAGINA} total={total} onCambiar={setPagina} />
        </>
      )}

      <ConfirmarEliminar
        visible={Boolean(calificacionEliminar)}
        mensaje={
          calificacionEliminar &&
          `¿Desea eliminar la nota de "${calificacionEliminar.evaluacion_nombre}" de ${calificacionEliminar.estudiante_nombre || 'este estudiante'}?`
        }
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setCalificacionEliminar(null)}
      />
    </>
  )
}
