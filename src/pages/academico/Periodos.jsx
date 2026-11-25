import { useEffect, useState } from 'react'
import Alerta from '../../components/Alerta'
import Cargando from '../../components/Cargando'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'
import EncabezadoPagina from '../../components/EncabezadoPagina'
import EstadoVacio from '../../components/EstadoVacio'
import Paginacion from '../../components/Paginacion'
import { useAuth } from '../../context/AuthContext'
import { api, obtenerResultados } from '../../services/api'
import PeriodoForm from './PeriodoForm'
import { formatearFecha } from './utilidades'

const TAMANO_PAGINA = 10

export default function Periodos() {
  const { esAdmin, esProfesor } = useAuth()

  const [periodos, setPeriodos] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [periodoEditando, setPeriodoEditando] = useState(null)
  const [periodoEliminar, setPeriodoEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  const puedeEditar = esAdmin || esProfesor
  const puedeEliminar = esAdmin

  useEffect(() => {
    let activo = true
    async function cargarPeriodos() {
      try {
        setCargando(true)
        setError('')
        // Los más recientes primero
        const datos = await api.get('/academico/periodos/', {
          page: pagina,
          page_size: TAMANO_PAGINA,
          ordering: '-fecha_inicio',
        })
        if (!activo) return
        setPeriodos(obtenerResultados(datos))
        setTotal(datos.count ?? 0)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarPeriodos()
    return () => {
      activo = false
    }
  }, [pagina, recargar])

  function abrirNuevo() {
    setPeriodoEditando(null)
    setMostrarFormulario(true)
    setMensaje('')
  }

  function abrirEdicion(periodo) {
    setPeriodoEditando(periodo)
    setMostrarFormulario(true)
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setPeriodoEditando(null)
  }

  async function guardarPeriodo(datos) {
    if (periodoEditando) {
      await api.patch(`/academico/periodos/${periodoEditando.id}/`, datos)
      setMensaje('Período actualizado correctamente.')
    } else {
      await api.post('/academico/periodos/', datos)
      setMensaje('Período creado correctamente.')
    }
    cerrarFormulario()
    setRecargar((valor) => valor + 1)
  }

  async function confirmarEliminacion() {
    try {
      setEliminando(true)
      await api.eliminar(`/academico/periodos/${periodoEliminar.id}/`)
      setMensaje('Período eliminado correctamente.')
      if (periodos.length === 1 && pagina > 1) {
        setPagina(pagina - 1)
      } else {
        setRecargar((valor) => valor + 1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminando(false)
      setPeriodoEliminar(null)
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Períodos lectivos" descripcion="Ciclos en los que se abren grupos y matrículas.">
        {puedeEditar && !mostrarFormulario && (
          <button className="btn btn-primary" onClick={abrirNuevo}>
            Nuevo período
          </button>
        )}
      </EncabezadoPagina>

      <Alerta tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />

      {mostrarFormulario && (
        <PeriodoForm
          key={periodoEditando?.id ?? 'nuevo'}
          periodo={periodoEditando}
          onGuardar={guardarPeriodo}
          onCancelar={cerrarFormulario}
        />
      )}

      <Alerta tipo="danger" mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando períodos..." />
      ) : periodos.length === 0 ? (
        <EstadoVacio mensaje="Todavía no hay períodos registrados." />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  {(puedeEditar || puedeEliminar) && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {periodos.map((periodo) => (
                  <tr key={periodo.id}>
                    <td className="fw-semibold">{periodo.nombre}</td>
                    <td>{formatearFecha(periodo.fecha_inicio)}</td>
                    <td>{formatearFecha(periodo.fecha_fin)}</td>
                    <td>
                      {periodo.activo ? (
                        <span className="badge text-bg-success">Activo</span>
                      ) : (
                        <span className="badge text-bg-secondary">Inactivo</span>
                      )}
                    </td>
                    {(puedeEditar || puedeEliminar) && (
                      <td className="text-end text-nowrap">
                        {puedeEditar && (
                          <button className="btn btn-outline-primary btn-sm me-2" onClick={() => abrirEdicion(periodo)}>
                            Editar
                          </button>
                        )}
                        {puedeEliminar && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => setPeriodoEliminar(periodo)}>
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
        visible={Boolean(periodoEliminar)}
        mensaje={
          periodoEliminar &&
          `¿Desea eliminar el período ${periodoEliminar.nombre}? También se eliminarán sus grupos asociados.`
        }
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPeriodoEliminar(null)}
      />
    </>
  )
}
