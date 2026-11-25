import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Alerta from '../../components/Alerta'
import Cargando from '../../components/Cargando'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'
import EncabezadoPagina from '../../components/EncabezadoPagina'
import EstadoVacio from '../../components/EstadoVacio'
import Paginacion from '../../components/Paginacion'
import { useAuth } from '../../context/AuthContext'
import { api, obtenerResultados } from '../../services/api'
import CursoForm from './CursoForm'

const TAMANO_PAGINA = 10

// Campos por los que el backend permite ordenar (?ordering=)
const OPCIONES_ORDEN = [
  { valor: 'codigo', texto: 'Código (A-Z)' },
  { valor: '-codigo', texto: 'Código (Z-A)' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
  { valor: '-nombre', texto: 'Nombre (Z-A)' },
  { valor: '-creditos', texto: 'Más créditos' },
  { valor: 'creditos', texto: 'Menos créditos' },
]

export default function Cursos() {
  const { esAdmin, esProfesor } = useAuth()
  // Desde Carreras se puede llegar con ?carrera=ID para ver solo sus cursos
  const [parametrosUrl] = useSearchParams()
  const carreraInicial = parametrosUrl.get('carrera') ?? ''

  const [cursos, setCursos] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Búsqueda, filtro y orden que se mandan al backend
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [carreraFiltro, setCarreraFiltro] = useState(carreraInicial)
  const [orden, setOrden] = useState('codigo')

  // Datos para los selects y para mostrar los códigos de prerrequisitos
  const [carreras, setCarreras] = useState([])
  const [todosLosCursos, setTodosLosCursos] = useState([])

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cursoEditando, setCursoEditando] = useState(null)
  const [cursoEliminar, setCursoEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  const puedeEditar = esAdmin || esProfesor
  const puedeEliminar = esAdmin

  // Carreras y lista completa de cursos (máximo 50, el límite del backend)
  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const [datosCarreras, datosCursos] = await Promise.all([
          api.get('/academico/carreras/', { page_size: 50, ordering: 'codigo' }),
          api.get('/academico/cursos/', { page_size: 50, ordering: 'codigo' }),
        ])
        if (!activo) return
        setCarreras(obtenerResultados(datosCarreras))
        setTodosLosCursos(obtenerResultados(datosCursos))
      } catch {
        if (activo) {
          setCarreras([])
          setTodosLosCursos([])
        }
      }
    }
    cargarCatalogos()
    return () => {
      activo = false
    }
  }, [recargar])

  useEffect(() => {
    let activo = true
    async function cargarCursos() {
      try {
        setCargando(true)
        setError('')
        const datos = await api.get('/academico/cursos/', {
          search: busqueda,
          carrera: carreraFiltro,
          ordering: orden,
          page: pagina,
          page_size: TAMANO_PAGINA,
        })
        if (!activo) return
        setCursos(obtenerResultados(datos))
        setTotal(datos.count ?? 0)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarCursos()
    return () => {
      activo = false
    }
  }, [busqueda, carreraFiltro, orden, pagina, recargar])

  function buscar(e) {
    e.preventDefault()
    setPagina(1)
    setBusqueda(textoBusqueda.trim())
  }

  function limpiarFiltros() {
    setTextoBusqueda('')
    setBusqueda('')
    setCarreraFiltro('')
    setOrden('codigo')
    setPagina(1)
  }

  // Muestra "IF0001, IF0002" a partir de los ids que manda el backend
  function codigosPrerrequisitos(ids) {
    if (!ids || ids.length === 0) return '—'
    return ids.map((id) => todosLosCursos.find((c) => c.id === id)?.codigo ?? `#${id}`).join(', ')
  }

  function abrirNuevo() {
    setCursoEditando(null)
    setMostrarFormulario(true)
    setMensaje('')
  }

  function abrirEdicion(curso) {
    setCursoEditando(curso)
    setMostrarFormulario(true)
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setCursoEditando(null)
  }

  async function guardarCurso(datos) {
    if (cursoEditando) {
      await api.patch(`/academico/cursos/${cursoEditando.id}/`, datos)
      setMensaje('Curso actualizado correctamente.')
    } else {
      await api.post('/academico/cursos/', datos)
      setMensaje('Curso creado correctamente.')
    }
    cerrarFormulario()
    setRecargar((valor) => valor + 1)
  }

  async function confirmarEliminacion() {
    try {
      setEliminando(true)
      await api.eliminar(`/academico/cursos/${cursoEliminar.id}/`)
      setMensaje('Curso eliminado correctamente.')
      if (cursos.length === 1 && pagina > 1) {
        setPagina(pagina - 1)
      } else {
        setRecargar((valor) => valor + 1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminando(false)
      setCursoEliminar(null)
    }
  }

  const hayFiltros = busqueda !== '' || carreraFiltro !== ''

  return (
    <>
      <EncabezadoPagina titulo="Cursos" descripcion="Cursos de cada carrera y sus prerrequisitos.">
        {puedeEditar && !mostrarFormulario && (
          <button className="btn btn-primary" onClick={abrirNuevo}>
            Nuevo curso
          </button>
        )}
      </EncabezadoPagina>

      <Alerta tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />

      {mostrarFormulario && (
        <CursoForm
          key={cursoEditando?.id ?? 'nuevo'}
          curso={cursoEditando}
          carreras={carreras}
          todosLosCursos={todosLosCursos}
          onGuardar={guardarCurso}
          onCancelar={cerrarFormulario}
        />
      )}

      {/* La búsqueda revisa código y nombre en el backend (?search=) */}
      <form className="card shadow-sm mb-3" onSubmit={buscar}>
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label htmlFor="busqueda" className="form-label small">
                Buscar
              </label>
              <input
                id="busqueda"
                className="form-control form-control-sm"
                placeholder="Código o nombre"
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="filtro-carrera" className="form-label small">
                Carrera
              </label>
              <select
                id="filtro-carrera"
                className="form-select form-select-sm"
                value={carreraFiltro}
                onChange={(e) => {
                  setCarreraFiltro(e.target.value)
                  setPagina(1)
                }}
              >
                <option value="">Todas</option>
                {carreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>
                    {carrera.codigo} - {carrera.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label htmlFor="orden" className="form-label small">
                Ordenar por
              </label>
              <select
                id="orden"
                className="form-select form-select-sm"
                value={orden}
                onChange={(e) => {
                  setOrden(e.target.value)
                  setPagina(1)
                }}
              >
                {OPCIONES_ORDEN.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm flex-fill">
                Buscar
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm flex-fill" onClick={limpiarFiltros}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </form>

      <Alerta tipo="danger" mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando cursos..." />
      ) : cursos.length === 0 ? (
        <EstadoVacio
          mensaje={hayFiltros ? 'No hay cursos que coincidan con la búsqueda.' : 'Todavía no hay cursos registrados.'}
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white mb-0">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Créditos</th>
                  <th className="d-none d-md-table-cell">Carrera</th>
                  <th className="d-none d-lg-table-cell">Prerrequisitos</th>
                  {(puedeEditar || puedeEliminar) && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cursos.map((curso) => (
                  <tr key={curso.id}>
                    <td className="fw-semibold">{curso.codigo}</td>
                    <td>{curso.nombre}</td>
                    <td>{curso.creditos}</td>
                    <td className="d-none d-md-table-cell">{curso.carrera_nombre}</td>
                    <td className="d-none d-lg-table-cell text-secondary">
                      {codigosPrerrequisitos(curso.prerrequisitos)}
                    </td>
                    {(puedeEditar || puedeEliminar) && (
                      <td className="text-end text-nowrap">
                        {puedeEditar && (
                          <button className="btn btn-outline-primary btn-sm me-2" onClick={() => abrirEdicion(curso)}>
                            Editar
                          </button>
                        )}
                        {puedeEliminar && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => setCursoEliminar(curso)}>
                            Eliminar
                          </button>
                        )}
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
        visible={Boolean(cursoEliminar)}
        mensaje={
          cursoEliminar &&
          `¿Desea eliminar el curso ${cursoEliminar.codigo} - ${cursoEliminar.nombre}? También se eliminarán sus grupos.`
        }
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setCursoEliminar(null)}
      />
    </>
  )
}
