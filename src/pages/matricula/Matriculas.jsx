import { useEffect, useState } from 'react'
import Alerta from '../../components/Alerta'
import Cargando from '../../components/Cargando'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'
import EncabezadoPagina from '../../components/EncabezadoPagina'
import EstadoVacio from '../../components/EstadoVacio'
import Paginacion from '../../components/Paginacion'
import { useAuth } from '../../context/AuthContext'
import { api, obtenerResultados } from '../../services/api'
import { ESTADOS_MATRICULA, formatearFecha, nombreGrupo } from '../calificaciones/utilidades'
import MatriculaForm from './MatriculaForm'

const TAMANO_PAGINA = 10
const FILTROS_VACIOS = { estado: '', grupo: '', search: '' }

function nombreCompleto(usuario) {
  return `${usuario.first_name} ${usuario.last_name}`.trim() || usuario.username
}

export default function Matriculas() {
  const { esAdmin, esEstudiante } = useAuth()

  const [matriculas, setMatriculas] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [filtrosFormulario, setFiltrosFormulario] = useState(FILTROS_VACIOS)
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)

  const [grupos, setGrupos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [matriculaEditando, setMatriculaEditando] = useState(null)
  const [matriculaEliminar, setMatriculaEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  // En el backend: el estudiante solicita su matrícula y solo el admin edita o borra
  const puedeCrear = esAdmin || esEstudiante

  useEffect(() => {
    let activo = true
    async function cargarCatalogos() {
      try {
        const datosGrupos = await api.get('/academico/grupos/', { page_size: 50 })
        if (activo) setGrupos(obtenerResultados(datosGrupos))
      } catch {
        if (activo) setGrupos([])
      }

      // Solo el admin puede ver la lista de perfiles para elegir al estudiante
      if (esAdmin) {
        try {
          const perfiles = await api.get('/usuarios/perfiles/')
          if (!activo) return
          setEstudiantes(
            perfiles
              .filter((p) => p.rol === 'ESTUDIANTE')
              .map((p) => ({ id: p.user.id, nombre: `${nombreCompleto(p.user)} (${p.user.username})` })),
          )
        } catch {
          if (activo) setEstudiantes([])
        }
      }
    }
    cargarCatalogos()
    return () => {
      activo = false
    }
  }, [esAdmin])

  useEffect(() => {
    let activo = true
    async function cargarMatriculas() {
      try {
        setCargando(true)
        setError('')
        const datos = await api.get('/matricula/', {
          ...filtros,
          page: pagina,
          page_size: TAMANO_PAGINA,
        })
        if (!activo) return
        setMatriculas(obtenerResultados(datos))
        setTotal(datos.count ?? 0)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarMatriculas()
    return () => {
      activo = false
    }
  }, [filtros, pagina, recargar])

  function manejarCambioFiltro(e) {
    setFiltrosFormulario({ ...filtrosFormulario, [e.target.name]: e.target.value })
  }

  function aplicarFiltros(e) {
    e.preventDefault()
    setPagina(1)
    setFiltros({ ...filtrosFormulario, search: filtrosFormulario.search.trim() })
  }

  function limpiarFiltros() {
    setFiltrosFormulario(FILTROS_VACIOS)
    setFiltros(FILTROS_VACIOS)
    setPagina(1)
  }

  function abrirNuevo() {
    setMatriculaEditando(null)
    setMostrarFormulario(true)
    setMensaje('')
  }

  function abrirEdicion(matricula) {
    setMatriculaEditando(matricula)
    setMostrarFormulario(true)
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setMatriculaEditando(null)
  }

  async function guardarMatricula(datos) {
    if (matriculaEditando) {
      await api.patch(`/matricula/${matriculaEditando.id}/`, datos)
      setMensaje('Matrícula actualizada correctamente.')
    } else {
      await api.post('/matricula/', datos)
      setMensaje(esAdmin ? 'Matrícula registrada correctamente.' : 'Su matrícula se registró correctamente.')
    }
    cerrarFormulario()
    setRecargar((valor) => valor + 1)
  }

  async function confirmarEliminacion() {
    try {
      setEliminando(true)
      await api.eliminar(`/matricula/${matriculaEliminar.id}/`)
      setMensaje('Matrícula eliminada correctamente.')
      if (matriculas.length === 1 && pagina > 1) {
        setPagina(pagina - 1)
      } else {
        setRecargar((valor) => valor + 1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminando(false)
      setMatriculaEliminar(null)
    }
  }

  const hayFiltros = Object.values(filtros).some((valor) => valor !== '')

  return (
    <>
      <EncabezadoPagina
        titulo={esEstudiante ? 'Mis matrículas' : 'Matrículas'}
        descripcion={
          esEstudiante ? 'Grupos en los que está matriculado.' : 'Estudiantes matriculados en cada grupo.'
        }
      >
        {puedeCrear && !mostrarFormulario && (
          <button className="btn btn-primary" onClick={abrirNuevo}>
            {esAdmin ? 'Nueva matrícula' : 'Solicitar matrícula'}
          </button>
        )}
      </EncabezadoPagina>

      <Alerta tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />

      {mostrarFormulario && (
        <MatriculaForm
          key={matriculaEditando?.id ?? 'nueva'}
          matricula={matriculaEditando}
          esAdmin={esAdmin}
          estudiantes={estudiantes}
          grupos={grupos}
          onGuardar={guardarMatricula}
          onCancelar={cerrarFormulario}
        />
      )}

      {/* Filtros combinables del backend: ?estado=&grupo=&search= */}
      <form className="card shadow-sm mb-3" onSubmit={aplicarFiltros}>
        <div className="card-body">
          <div className="row g-2 align-items-end">
            {!esEstudiante && (
              <div className="col-md-3">
                <label htmlFor="filtro-search" className="form-label small">
                  Estudiante
                </label>
                <input
                  id="filtro-search"
                  name="search"
                  className="form-control form-control-sm"
                  placeholder="Usuario o nombre"
                  value={filtrosFormulario.search}
                  onChange={manejarCambioFiltro}
                />
              </div>
            )}
            <div className="col-md-4">
              <label htmlFor="filtro-grupo" className="form-label small">
                Grupo
              </label>
              <select
                id="filtro-grupo"
                name="grupo"
                className="form-select form-select-sm"
                value={filtrosFormulario.grupo}
                onChange={manejarCambioFiltro}
              >
                <option value="">Todos</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {nombreGrupo(grupo)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="filtro-estado" className="form-label small">
                Estado
              </label>
              <select
                id="filtro-estado"
                name="estado"
                className="form-select form-select-sm"
                value={filtrosFormulario.estado}
                onChange={manejarCambioFiltro}
              >
                <option value="">Todos</option>
                {ESTADOS_MATRICULA.map((estado) => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm flex-fill">
                Filtrar
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
        <Cargando texto="Cargando matrículas..." />
      ) : matriculas.length === 0 ? (
        <EstadoVacio
          mensaje={hayFiltros ? 'No hay matrículas con esos filtros.' : 'Todavía no hay matrículas registradas.'}
        />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white mb-0">
              <thead className="table-light">
                <tr>
                  {!esEstudiante && <th>Estudiante</th>}
                  <th>Grupo</th>
                  <th className="d-none d-md-table-cell">Fecha</th>
                  <th>Estado</th>
                  {esAdmin && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {matriculas.map((matricula) => (
                  <tr key={matricula.id}>
                    {!esEstudiante && <td>{matricula.estudiante_username}</td>}
                    <td>{matricula.grupo_detalle}</td>
                    <td className="d-none d-md-table-cell">{formatearFecha(matricula.fecha_matricula)}</td>
                    <td>
                      <span
                        className={`badge text-bg-${matricula.estado === 'MATRICULADO' ? 'success' : 'secondary'}`}
                      >
                        {matricula.estado === 'MATRICULADO' ? 'Matriculado' : 'Retirado'}
                      </span>
                    </td>
                    {esAdmin && (
                      <td className="text-end text-nowrap">
                        <button className="btn btn-outline-primary btn-sm me-2" onClick={() => abrirEdicion(matricula)}>
                          Editar
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => setMatriculaEliminar(matricula)}>
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
        visible={Boolean(matriculaEliminar)}
        mensaje={
          matriculaEliminar &&
          `¿Desea eliminar la matrícula de ${matriculaEliminar.estudiante_username} en ${matriculaEliminar.grupo_detalle}? También se borrarán sus notas.`
        }
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setMatriculaEliminar(null)}
      />
    </>
  )
}
