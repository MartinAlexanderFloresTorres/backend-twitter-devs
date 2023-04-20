import Notificacion from '../models/Notificacion.js'

// OBTENER
export const obtener = async (req, res) => {
  try {
    const { usuario } = req
    // agregar la paginacion de mongoose-paginate-v2
    const page = parseInt(req.query.page) || 1

    const limit = parseInt(req.query.limit) || 10

    const notificaciones = await Notificacion.paginate(
      { usuario: usuario._id },
      {
        limit,
        page,
        sort: { visto: 1, createdAt: -1 }
      }
    )

    // Enviar Respuesta
    res.json(notificaciones)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ESTADO
export const estado = async (req, res) => {
  try {
    const { usuario } = req
    const { notificacionId } = req.params

    const notificacion = await Notificacion.findById(notificacionId)

    if (!notificacion) return res.status(404).json({ message: 'La notificación no existe' })

    // Es creado
    if (usuario._id.toString() !== notificacion.usuario.toString()) return res.status(404).json({ message: 'No tiene permisos' })

    // Cambiar estado
    notificacion.visto = !notificacion.visto

    // Guardar
    await notificacion.save()

    // Enviar Respuesta
    res.json({ message: notificacion.visto ? 'Marcado como visto' : 'Desmarcado como visto', notificacion })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// MARCAR VISTOS TODAS
export const marcarVistosTodas = async (req, res) => {
  try {
    const { usuario } = req

    const notificaciones = await Notificacion.find({ usuario: usuario._id, visto: false })

    // Existe la notifacion
    if (notificaciones.length === 0) return res.status(200).json({ message: 'No hay notificaciónes que marcar' })

    // Marcar vistos todas
    await Promise.all(
      notificaciones.map(async (notificacion) => {
        // Es creado
        if (usuario._id.toString() !== notificacion.usuario.toString()) return res.status(404).json({ message: 'No tiene permisos' })
        // Marcar visto
        notificacion.visto = true

        // Guardar
        return await notificacion.save()
      })
    )

    // Enviar Respuesta
    res.json({ message: 'Marcados como vistos' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ELIMINAR
export const eliminar = async (req, res) => {
  try {
    const { usuario } = req
    const { notificacionId } = req.params

    const notificacion = await Notificacion.findById(notificacionId)

    // Existe la notifacion
    if (!notificacion) return res.status(404).json({ message: 'La notificación no existe' })

    // Es creado
    if (usuario._id.toString() !== notificacion.usuario.toString()) return res.status(404).json({ message: 'No tiene permisos' })

    // Eliminar
    await notificacion.deleteOne()

    // Enviar Respuesta
    res.json({ message: 'Notificación Eliminada', notificacion })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ELIMINAR TODAS
export const eliminarTodas = async (req, res) => {
  try {
    const { usuario } = req

    const notificaciones = await Notificacion.find({ usuario: usuario._id })

    // Existe la notifacion
    if (notificaciones.length === 0) return res.status(404).json({ message: 'No hay notificaciónes que eliminar' })

    // Eliminar
    await Promise.all(
      notificaciones.map(async (notificacion) => {
        // Es creado
        if (usuario._id.toString() !== notificacion.usuario.toString()) return res.status(404).json({ message: 'No tiene permisos' })
        // Eliminar
        return await notificacion.deleteOne()
      })
    )

    // Enviar Respuesta
    res.json({ message: 'Notificaciónes Eliminadas' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}
