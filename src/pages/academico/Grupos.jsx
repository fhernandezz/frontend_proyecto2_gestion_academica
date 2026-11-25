import { useEffect, useState } from 'react'
import Alerta from '../../components/Alerta'
import Cargando from '../../components/Cargando'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'
import EncabezadoPagina from '../../components/EncabezadoPagina'
import EstadoVacio from '../../components/EstadoVacio'
import Paginacion from '../../components/Paginacion'
import { useAuth } from '../../context/AuthContext'
import { api, obtenerResultados } from '../../services/api'
import GrupoForm from './GrupoForm'
import { nombreGrupo } from './utilidades'

const TAMANO_PAGINA = 10
const FILTROS_VACIOS = { curso: '', periodo: '' }

function nombreCompleto(usuario) {
  return `${usuario.first_name} ${usuario.last_name}`.trim() || usuario.username
}

export default function Grupos() {
  const { perfil, esAdmin, esProfesor } = useAuth()

  const [grupos, setGrupos] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)

  // Catálogos para los selects (relaciones del grupo)
  const [cursos, setCursos] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [profesores, setProfesores] = useState([])

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [grupoEditando, setGrupoEditando] = useState(null)
  const [grupoEliminar, setGrupoEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  const puedeEditar = esAdmin || esProfesor
  const puedeEliminar = esAdmin

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const [datosCursos, datosPeriodos] = await Promise.all([
          api.get('/academico/cursos/', { page_size: 50, ordering: 'codigo' }),
          api.get('/academico/periodos/', { page_size: 50, ordering: '-fecha_inicio' }),
        ])
        if (!activo) return
        setCursos(obtenerResultados(datosCursos))
        setPeriodos(obtenerResultados(datosPeriodos))
      } catch {
        // Sin catálogos los selects quedan vacíos, pero la tabla sigue funcionando
      }
    }
    cargarCatalogos()
    return () => {
      activo = false
    }
  }, [])

  // La lista de perfiles solo la puede ver el admin. Un profesor solo
  // puede asignarse a sí mismo, así que le mostramos únicamente su nombre.
  useEffect(() => {
    let activo = true
    async function cargarProfesores() {
      if (esAdmin) {
        try {
          const perfiles = await api.get('/usuarios/perfiles/')
          if (!activo) return
          setProfesores(
            perfiles
              .filter((p) => p.rol === 'PROFESOR')
              .map((p) => ({ id: p.user.id, nombre: nombreCompleto(p.user) })),
          )
        } catch {
          if (activo) setProfesores([])
        }
      } else if (esProfesor && perfil) {
        setProfesores([{ id: perfil.user.id, nombre: nombreCompleto(perfil.user) }])
      }
    }
    cargarProfesores()
    return () => {
      activo = false
    }
  }, [esAdmin, esProfesor, perfil])

  useEffect(() => {
    let activo = true
    async function cargarGrupos() {
      try {
        setCargando(true)
        setError('')
        const datos = await api.get('/academico/grupos/', {
          ...filtros,
          page: pagina,
          page_size: TAMANO_PAGINA,
        })
        if (!activo) return
        setGrupos(obtenerResultados(datos))
        setTotal(datos.count ?? 0)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarGrupos()
    return () => {
      activo = false
    }
  }, [filtros, pagina, recargar])

  // Los filtros se aplican apenas cambia el select
  function manejarCambioFiltro(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
    setPagina(1)
  }

  function abrirNuevo() {
    setGrupoEditando(null)
    setMostrarFormulario(true)
    setMensaje('')
  }

  function abrirEdicion(grupo) {
    setGrupoEditando(grupo)
    setMostrarFormulario(true)
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setGrupoEditando(null)
  }

  async function guardarGrupo(datos) {
    if (grupoEditando) {
      await api.patch(`/academico/grupos/${grupoEditando.id}/`, datos)
      setMensaje('Grupo actualizado correctamente.')
    } else {
      await api.post('/academico/grupos/', datos)
      setMensaje('Grupo creado correctamente.')
    }
    cerrarFormulario()
    setRecargar((valor) => valor + 1)
  }

  async function confirmarEliminacion() {
    try {
      setEliminando(true)
      await api.eliminar(`/academico/grupos/${grupoEliminar.id}/`)
      setMensaje('Grupo eliminado correctamente.')
      if (grupos.length === 1 && pagina > 1) {
        setPagina(pagina - 1)
      } else {
        setRecargar((valor) => valor + 1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminando(false)
      setGrupoEliminar(null)
    }
  }

  const hayFiltros = filtros.curso !== '' || filtros.periodo !== ''

  return (
    <>
      <EncabezadoPagina titulo="Grupos" descripcion="Grupos abiertos por curso y período, con su profesor y cupo.">
        {puedeEditar && !mostrarFormulario && (
          <button className="btn btn-primary" onClick={abrirNuevo}>
            Nuevo grupo
          </button>
        )}
      </EncabezadoPagina>

      <Alerta tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />

      {mostrarFormulario && (
        <GrupoForm
          key={grupoEditando?.id ?? 'nuevo'}
          grupo={grupoEditando}
          cursos={cursos}
          periodos={periodos}
          profesores={profesores}
          onGuardar={guardarGrupo}
          onCancelar={cerrarFormulario}
        />
      )}

      {/* Filtros combinables: ?curso=&periodo= */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <label htmlFor="filtro-curso" className="form-label small">
                Curso
              </label>
              <select
                id="filtro-curso"
                name="curso"
                className="form-select form-select-sm"
                value={filtros.curso}
                onChange={manejarCambioFiltro}
              >
                <option value="">Todos</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.codigo} - {curso.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="filtro-periodo" className="form-label small">
                Período
              </label>
              <select
                id="filtro-periodo"
                name="periodo"
                className="form-select form-select-sm"
                value={filtros.periodo}
                onChange={manejarCambioFiltro}
              >
                <option value="">Todos</option>
                {periodos.map((periodo) => (
                  <option key={periodo.id} value={periodo.id}>
                    {periodo.nombre}
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
        <Cargando texto="Cargando grupos..." />
      ) : grupos.length === 0 ? (
        <EstadoVacio
          mensaje={hayFiltros ? 'No hay grupos con esos filtros.' : 'Todavía no hay grupos registrados.'}
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white mb-0">
              <thead className="table-light">
                <tr>
                  <th>Curso</th>
                  <th>Grupo</th>
                  <th>Período</th>
                  <th className="d-none d-md-table-cell">Profesor</th>
                  <th>Cupo</th>
                  {(puedeEditar || puedeEliminar) && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.id}>
                    <td>{grupo.curso_nombre}</td>
                    <td>G{grupo.numero_grupo}</td>
                    <td>{grupo.periodo_nombre}</td>
                    <td className="d-none d-md-table-cell">
                      {grupo.profesor_nombre || <span className="text-secondary">Sin asignar</span>}
                    </td>
                    <td>{grupo.cupo_maximo}</td>
                    {(puedeEditar || puedeEliminar) && (
                      <td className="text-end text-nowrap">
                        {puedeEditar && (
                          <button className="btn btn-outline-primary btn-sm me-2" onClick={() => abrirEdicion(grupo)}>
                            Editar
                          </button>
                        )}
                        {puedeEliminar && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => setGrupoEliminar(grupo)}>
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
        visible={Boolean(grupoEliminar)}
        mensaje={
          grupoEliminar &&
          `¿Desea eliminar el grupo ${nombreGrupo(grupoEliminar)}? También se eliminarán sus matrículas, evaluaciones y horarios.`
        }
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setGrupoEliminar(null)}
      />
    </>
  )
}
