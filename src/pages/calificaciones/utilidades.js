// Funciones que usan las pantallas de Matrícula, Evaluaciones y Calificaciones

// Convierte el error 400 de Django ({campo: ["mensaje"]} o {campo: "mensaje"})
// en {campo: "mensaje"} para mostrarlo debajo de cada input
export function erroresDelServidor(err) {
  if (err.status !== 400 || !err.detalles || typeof err.detalles !== 'object') {
    return { campos: {}, general: err.message }
  }

  const campos = {}
  for (const [campo, mensajes] of Object.entries(err.detalles)) {
    campos[campo] = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes)
  }
  return {
    campos,
    general: campos.non_field_errors || campos.error || 'El servidor rechazó los datos. Revise los campos marcados.',
  }
}

export function claseCampo(errores, campo, base = 'form-control') {
  return `${base} ${errores[campo] ? 'is-invalid' : ''}`
}

export function nombreGrupo(grupo) {
  return `${grupo.curso_nombre} - G${grupo.numero_grupo} (${grupo.periodo_nombre})`
}

// "2026-11-24T20:15:00-06:00" -> "24/11/2026"
export function formatearFecha(fechaHora) {
  if (!fechaHora) return '—'
  const [anio, mes, dia] = fechaHora.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

export const ESTADOS_MATRICULA = [
  { valor: 'MATRICULADO', texto: 'Matriculado' },
  { valor: 'RETIRADO', texto: 'Retirado' },
]
