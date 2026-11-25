import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alerta from '../../components/Alerta'
import Cargando from '../../components/Cargando'
import ConfirmarEliminar from '../../components/ConfirmarEliminar'
import EncabezadoPagina from '../../components/EncabezadoPagina'
import EstadoVacio from '../../components/EstadoVacio'
import Paginacion from '../../components/Paginacion'
import { useAuth } from '../../context/AuthContext'
import { api, obtenerResultados } from '../../services/api'
import CarreraForm from './CarreraForm'

const TAMANO_PAGINA = 10

export default function Carreras() {
  const { esAdmin, esProfesor } = useAuth()

  const [carreras, setCarreras] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [carreraEditando, setCarreraEditando] = useState(null)
  const [carreraEliminar, setCarreraEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [recargar, setRecargar] = useState(0)

  // En el backend el profesor puede crear y editar, pero solo el admin elimina
  const puedeEditar = esAdmin || esProfesor
  const puedeEliminar = esAdmin

  useEffect(() => {
    let activo = true
    async function cargarCarreras() {
      try {
        setCargando(true)
        setError('')
        const datos = await api.get('/academico/carreras/', {
          page: pagina,
          page_size: TAMANO_PAGINA,
          ordering: 'codigo',
        })
        if (!activo) return
        setCarreras(obtenerResultados(datos))
        setTotal(datos.count ?? 0)
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargarCarreras()
    return () => {
      activo = false
    }
  }, [pagina, recargar])

  function abrirNuevo() {
    setCarreraEditando(null)
    setMostrarFormulario(true)
    setMensaje('')
  }

  function abrirEdicion(carrera) {
    setCarreraEditando(carrera)
    setMostrarFormulario(true)
    setMensaje('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setCarreraEditando(null)
  }

  async function guardarCarrera(datos) {
    if (carreraEditando) {
      await api.patch(`/academico/carreras/${carreraEditando.id}/`, datos)
      setMensaje('Carrera actualizada correctamente.')
    } else {
      await api.post('/academico/carreras/', datos)
      setMensaje('Carrera creada correctamente.')
    }
    cerrarFormulario()
    setRecargar((valor) => valor + 1)
  }

  async function confirmarEliminacion() {
    try {
      setEliminando(true)
      await api.eliminar(`/academico/carreras/${carreraEliminar.id}/`)
      setMensaje('Carrera eliminada correctamente.')
      if (carreras.length === 1 && pagina > 1) {
        setPagina(pagina - 1)
      } else {
        setRecargar((valor) => valor + 1)
      }
    } catch (err) {
      // Si la carrera tiene cursos, Django responde 409 y no deja borrarla
      setError(err.status === 409 ? `No se puede eliminar: ${err.message}` : err.message)
    } finally {
      setEliminando(false)
      setCarreraEliminar(null)
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Carreras" descripcion="Carreras que ofrece la institución.">
        {puedeEditar && !mostrarFormulario && (
          <button className="btn btn-primary" onClick={abrirNuevo}>
            Nueva carrera
          </button>
        )}
      </EncabezadoPagina>

      <Alerta tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />

      {mostrarFormulario && (
        <CarreraForm
          key={carreraEditando?.id ?? 'nueva'}
          carrera={carreraEditando}
          onGuardar={guardarCarrera}
          onCancelar={cerrarFormulario}
        />
      )}

      <Alerta tipo="danger" mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando carreras..." />
      ) : carreras.length === 0 ? (
        <EstadoVacio mensaje="Todavía no hay carreras registradas." />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white mb-0">
              <thead className="table-light">
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th className="d-none d-md-table-cell">Descripción</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carreras.map((carrera) => (
                  <tr key={carrera.id}>
                    <td className="fw-semibold">{carrera.codigo}</td>
                    <td>{carrera.nombre}</td>
                    <td className="d-none d-md-table-cell text-secondary">{carrera.descripcion || '—'}</td>
                    <td className="text-end text-nowrap">
                      {/* Relación carrera -> cursos: abre Cursos ya filtrado por esta carrera */}
                      <Link to={`/academico/cursos?carrera=${carrera.id}`} className="btn btn-outline-secondary btn-sm me-2">
                        Ver cursos
                      </Link>
                      {puedeEditar && (
                        <button className="btn btn-outline-primary btn-sm me-2" onClick={() => abrirEdicion(carrera)}>
                          Editar
                        </button>
                      )}
                      {puedeEliminar && (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => setCarreraEliminar(carrera)}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={pagina} tamano={TAMANO_PAGINA} total={total} onCambiar={setPagina} />
        </>
      )}

      <ConfirmarEliminar
        visible={Boolean(carreraEliminar)}
        mensaje={carreraEliminar && `¿Desea eliminar la carrera ${carreraEliminar.codigo} - ${carreraEliminar.nombre}?`}
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setCarreraEliminar(null)}
      />
    </>
  )
}
