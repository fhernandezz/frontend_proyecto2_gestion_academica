// Funciones que comparten las pantallas del módulo académico

// Convierte el error 400 de Django ({campo: ["mensaje"]}) en un objeto
// {campo: "mensaje"} para mostrarlo debajo de cada input
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

// Clase de Bootstrap para marcar en rojo el input que tiene error
export function claseCampo(errores, campo, base = 'form-control') {
  return `${base} ${errores[campo] ? 'is-invalid' : ''}`
}

// Django manda las fechas como "2026-08-01"; las mostramos como 01/08/2026
export function formatearFecha(fecha) {
  if (!fecha) return '—'
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function nombreGrupo(grupo) {
  return `${grupo.curso_nombre} - G${grupo.numero_grupo} (${grupo.periodo_nombre})`
}
