import Mensaje from '../models/Mensaje.js'
import Usuario from '../models/Usuario.js'
import Conversacion from '../models/Conversacion.js'
import writeImagen from '../helpers/writeImagen.js'
import deleteFile from '../cloudinary/deleteFile.js'
import isValidId from '../helpers/isValidId.js'
import crearNotificacion from '../notificaciones/crearNotificacion.js'

// CREAR
export const crear = async (req, res) => {
  try {
    const { receptor } = req.params
    const {
      usuario: { _id: emisor }
    } = req
    const { mensaje } = req.body

    if (!mensaje && !req?.files?.foto) return res.status(403).json({ message: 'El mensaje es obligatorio' })

    // Id valido
    if (!isValidId(receptor)) return res.status(400).json({ message: 'ID del receptor no valido' })

    if (receptor === emisor.toString()) return res.status(403).json({ message: 'No te puedes enviar mensajes a ti mismo' })

    // Existe una conversacion
    const conversacionEncontrada = await Conversacion.findOne({ miembros: { $all: [receptor, emisor] } }).populate('miembros', 'usuario nombre avatar suspendido')

    // NO EXISTE LA CONVERSACION
    if (!conversacionEncontrada) {
      // Crear una conversacion
      const conversacion = new Conversacion({ miembros: [emisor, receptor] })

      // Crear mensaje
      const mensajeCreado = new Mensaje({
        conversacionId: conversacion._id,
        mensaje,
        emisor,
        receptor
      })

      // Subir foto
      if (req?.files?.foto) {
        const foto = await writeImagen(req.files.foto, 'clon-twitter/mensajes-fotos')
        mensajeCreado.foto = foto
      }

      // Quitamos eliminadoPor[]
      conversacion.eliminadoPor = []

      // Guardamos el ultimo mensaje
      conversacion.ultimoMensaje = {
        usuarioId: emisor,
        texto: mensaje,
        isfoto: mensajeCreado.foto !== null
      }

      // CREAMOS LA NOTIFICACION
      const notificacion = await crearNotificacion({
        receptor,
        texto: `${req.usuario.usuario} Te envio un mensaje 😀 link*=${`/conversacion/${conversacion._id}/mensajes/${receptor}/${emisor}`}=ver-mensaje`
      })

      // Guardar
      const [conversacionGuardada, mensajeGuardado] = await Promise.all([conversacion.save(), mensajeCreado.save()])

      // Enviar respuesta
      return res.json({ message: 'Mensaje Enviando', mensaje: mensajeGuardado, conversacion: conversacionGuardada, notificacion })
    }

    // Verificar si esta bloqueado la conversacion
    if (conversacionEncontrada.bloqueado) return res.status(403).json({ message: 'Chat Bloqueado' })

    // Crear mensaje
    const mensajeCreado = new Mensaje({
      conversacionId: conversacionEncontrada._id,
      mensaje,
      emisor,
      receptor
    })

    // Subir foto
    if (req?.files?.foto) {
      const foto = await writeImagen(req.files.foto, 'clon-twitter/mensajes-fotos')
      mensajeCreado.foto = foto
    }

    // Quitamos eliminadoPor[]
    conversacionEncontrada.eliminadoPor = []

    // Guardamos el ultimo mensaje
    conversacionEncontrada.ultimoMensaje = {
      usuarioId: emisor,
      texto: mensaje,
      isfoto: mensajeCreado.foto !== null
    }

    // Guardamos
    const [mensajeGuardado] = await Promise.all([mensajeCreado.save(), conversacionEncontrada.save()])

    // Obtener el mensaje reciente
    const mensajeReciente = await Mensaje.findById(mensajeGuardado._id).populate('emisor', 'usuario nombre avatar suspendido').populate('receptor', 'usuario nombre avatar suspendido')

    // Enviar respuesta
    return res.json({ message: 'Mensaje Enviando', mensaje: mensajeReciente, conversacion: conversacionEncontrada })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER MENSAJES PREVIOS
export const obtenerPrevios = async (req, res) => {
  try {
    const {
      usuario: { _id: emisor }
    } = req

    // agregar la paginacion de mongoose-paginate-v2
    const page = parseInt(req.query.page) || 1

    const limit = parseInt(req.query.limit) || 10

    // Obtener tweets con paginación y populates
    const options = {
      page,
      limit,
      populate: [{ path: 'miembros', select: 'usuario nombre avatar suspendido' }],
      sort: { updatedAt: -1 }
    }

    // Conversaciones que no este incluido en el arreglo de archivadoPor[] y eliminadoPor[] -> del emisor
    const datConversaciones = await Conversacion.paginate({ miembros: { $all: [emisor] }, archivadoPor: { $nin: [emisor.toString()] }, eliminadoPor: { $nin: [emisor.toString()] }, $or: [{ 'ultimoMensaje.texto': { $ne: '' } }, { 'ultimoMensaje.isfoto': { $ne: false } }] }, options)

    // Enviar respuesta
    res.json(datConversaciones)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER CONVERSACION
export const obtenerConversacion = async (req, res) => {
  try {
    const { receptor } = req.params
    const {
      usuario: { _id: emisor }
    } = req

    // Conversacion
    const conversacion = await Conversacion.findOne({ miembros: { $all: [emisor, receptor] } })

    if (!conversacion) {
      // Crear una conversacion
      const conversacion = new Conversacion({ miembros: [emisor, receptor] })

      // Guardar la conversacion
      const conversacionGuardada = await conversacion.save()
      // Enviar respuesta
      return res.json(conversacionGuardada)
    }
    // Enviar respuesta
    res.json(conversacion)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER MENSAJES PREVIOS ARCHIVADOS
export const obtenerPreviosArchivados = async (req, res) => {
  try {
    const {
      usuario: { _id: emisor }
    } = req

    // agregar la paginacion de mongoose-paginate-v2
    const page = parseInt(req.query.page) || 1

    const limit = parseInt(req.query.limit) || 10

    // Obtener tweets con paginación y populates
    const options = {
      page,
      limit,
      populate: [{ path: 'miembros', select: 'usuario nombre avatar suspendido' }],
      sort: { updatedAt: -1 }
    }

    // Conversaciones que no este incluido en el arreglo de archivadoPor[] -> del emisor
    const datConversaciones = await Conversacion.paginate({ miembros: { $all: [emisor] }, archivadoPor: { $in: [emisor.toString()] } }, options)
    // Enviar respuesta
    res.json(datConversaciones)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER MENSAJES TO
export const obtenerByTo = async (req, res) => {
  try {
    const { conversacionId, receptor } = req.params
    const {
      usuario: { _id: emisor }
    } = req

    // Id valido
    if (!isValidId(receptor)) return res.status(400).json({ message: 'ID del receptor no valido' })

    // Id valido
    if (!isValidId(conversacionId)) return res.status(400).json({ message: 'ID de la conversacion no valido' })

    // No iguales
    if (receptor === emisor.toString()) return res.status(403).json({ message: 'Accion no valida' })

    // Obtener mensajes
    const conversacion = await Conversacion.findById(conversacionId).populate('miembros', 'usuario nombre avatar suspendido')

    if (!conversacion?.miembros) return res.status(404).json({ message: 'Conversacion no encontrada' })

    const miembroConversacion = conversacion.miembros.find((m) => m._id.toString() === emisor.toString())

    // Solo puede ver los miembros
    if (!miembroConversacion) {
      return res.status(404).json({ message: 'No tiene permisos' })
    }

    const miembroEliminoConversacion = conversacion.eliminadoPor.includes(miembroConversacion._id.toString())

    // Existe el mienbro en eliminadoPor[] del miembro que elimino la conversacion
    if (miembroEliminoConversacion) return res.status(404).json({ message: 'Esta conversación fue eliminada' })

    const mensajes = await Mensaje.find({ conversacionId }).populate('emisor', 'suspendido').populate('receptor', 'suspendido')

    // Enviar respuesta
    res.json({ mensajes, conversacion })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ELIMINAR
export const eliminar = async (req, res) => {
  try {
    const { conversacionId, receptor } = req.params
    const {
      usuario: { _id: emisor },
      usuario
    } = req

    // Id valido
    if (!isValidId(receptor)) return res.status(400).json({ message: 'ID del receptor no valido' })

    // Id valido
    if (!isValidId(conversacionId)) return res.status(400).json({ message: 'ID de la conversacion no valido' })

    // No iguales
    if (receptor === emisor.toString()) return res.status(403).json({ message: 'Accion no valida' })

    // Obtener conversacion
    const conversacion = await Conversacion.findById(conversacionId).populate('miembros', 'usuario nombre avatar suspendido')

    // Solo puede ver los miembros
    if (!conversacion.miembros.some((m) => m._id.toString() === emisor.toString())) {
      return res.status(404).json({ message: 'No tiene permisos' })
    }

    // Se encuentra el emisor en el array
    if (conversacion.eliminadoPor.includes(emisor.toString())) {
      // Quitamos
      conversacion.eliminadoPor.pull(emisor.toString())
      // Guardamos
      await conversacion.save()
      // Enviar respuesta
      return res.json({ message: 'Chat Recuperado' })
    }

    // Agregamos
    conversacion.eliminadoPor.push(emisor.toString())

    // Se encuentra el emisor en el array
    if (conversacion.archivadoPor.includes(emisor.toString())) {
      // Quitamos
      conversacion.archivadoPor.pull(emisor.toString())
    }

    // Obtener los mensajes de esa conversacion
    const mensajes = await Mensaje.find({ conversacionId })

    await Promise.all(
      mensajes.map(async (mensaje) => {
        // Si ambos eliminaron su conversacion
        if (conversacion.eliminadoPor.length === 2) {
          if (mensaje.foto) {
            await deleteFile({ public_id: mensaje.foto.public_id, folder: 'clon-twitter/mensajes-fotos' })
          }
          // Eliminar cada mensaje
          return await mensaje.deleteOne()
        }

        // Eliminar solo los mensajes del emisor
        if (mensaje.emisor.toString() === emisor.toString()) {
          if (!mensaje.mensaje.includes('elimino su conversación')) {
            // Eliminar las fotos de cloudinary
            if (mensaje.foto) {
              await deleteFile({ public_id: mensaje.foto.public_id, folder: 'clon-twitter/mensajes-fotos' })
            }
            // Eliminar cada mensaje
            return await mensaje.deleteOne()
          }
        }
      })
    )

    if (conversacion.eliminadoPor.length !== 2) {
      // Crear mensaje que indique que elimino el chat
      const mensaje = new Mensaje({
        conversacionId: conversacion._id,
        mensaje: `${usuario.usuario} elimino su conversación`,
        emisor,
        receptor
      })

      // CREAMOS LA NOTIFICACION
      const notificacion = await crearNotificacion({
        receptor,
        texto: `${usuario.usuario} A eliminado sus mensajes de su conversación.`
      })

      // Guardamos el ultimo mensaje
      conversacion.ultimoMensaje = {
        usuarioId: emisor,
        texto: ` ${usuario.usuario} elimino su conversación`,
        isfoto: false
      }

      // Guardamos
      await Promise.all([conversacion.save(), mensaje.save()])

      // Obtenes mensajes recientes
      const mensajesRecientes = await Mensaje.find({ conversacionId }).populate('emisor', 'usuario nombre avatar suspendido').populate('receptor', 'usuario nombre avatar suspendido')

      // Enviar respuesta
      return res.json({ message: 'Chat Eliminado', mensajes: mensajesRecientes, conversacion, notificacion })
    }

    // Guardamos el ultimo mensaje
    conversacion.ultimoMensaje = {
      usuarioId: '',
      texto: '',
      isfoto: false
    }

    // Guardamos
    await conversacion.save()

    // Obtenes mensajes recientes
    const mensajesRecientes = await Mensaje.find({ conversacionId }).populate('emisor', 'usuario nombre avatar suspendido').populate('receptor', 'usuario nombre avatar suspendido')

    // Enviar respuesta
    res.json({ message: 'Chat Eliminado', mensajes: mensajesRecientes, conversacion })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ARCHIVAR MENSAJES TO
export const archivar = async (req, res) => {
  try {
    const { conversacionId, receptor } = req.params
    const {
      usuario: { _id: emisor }
    } = req

    // Id valido
    if (!isValidId(receptor)) return res.status(400).json({ message: 'ID del receptor no valido' })

    // Id valido
    if (!isValidId(conversacionId)) return res.status(400).json({ message: 'ID de la conversacion no valido' })

    // No iguales
    if (receptor === emisor.toString()) return res.status(403).json({ message: 'Accion no valida' })

    // Obtener mensajes
    const conversacion = await Conversacion.findById(conversacionId)

    if (!conversacion?.miembros) return res.status(404).json({ message: 'Conversacion no encontrada' })

    // Solo puede ver los miembros
    if (!conversacion.miembros.includes(emisor.toString())) {
      return res.status(404).json({ message: 'No tiene permisos' })
    }

    // Se encuentra el emisor en el array
    if (conversacion.archivadoPor.includes(emisor.toString())) {
      // Quitamos
      conversacion.archivadoPor.pull(emisor.toString())
      // Guardamos
      await conversacion.save()
      // Enviar respuesta
      res.json({ message: 'Desarchivado' })
    } else {
      // Agregamos
      conversacion.archivadoPor.push(emisor.toString())
      // Guardamos
      await conversacion.save()
      // Enviar respuesta
      res.json({ message: 'Archivado' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// BLOQUEAR MENSAJES TO
export const bloquear = async (req, res) => {
  try {
    const { conversacionId, receptor } = req.params
    const {
      usuario: { _id: emisor }
    } = req

    // Id valido
    if (!isValidId(receptor)) return res.status(400).json({ message: 'ID del receptor no valido' })

    // Id valido
    if (!isValidId(conversacionId)) return res.status(400).json({ message: 'ID de la conversacion no valido' })

    // No iguales
    if (receptor === emisor.toString()) return res.status(403).json({ message: 'Accion no valida' })

    // Obtener mensajes
    const conversacion = await Conversacion.findById(conversacionId).populate('miembros', 'usuario nombre avatar suspendido')

    // Obtener usuario
    const usuarioPerfil = await Usuario.findById(receptor)

    if (!conversacion?.miembros) return res.status(404).json({ message: 'Conversacion no encontrada' })
    if (!usuarioPerfil) return res.status(404).json({ message: 'usuario de perfil no encontrado' })

    // Solo puede ver los miembros
    if (!conversacion.miembros.some((m) => m._id.toString() === emisor.toString())) {
      return res.status(404).json({ message: 'No tiene permisos' })
    }

    // Solo se puede desbloquear por el mismo usuario que desbloqueo
    if (conversacion.bloqueadoPor !== '') {
      if (conversacion.bloqueadoPor !== emisor.toString()) {
        return res.status(404).json({ message: 'No tiene permisos para desbloquear' })
      }
    }

    //  Bloqueamos al usuario
    if (usuarioPerfil.bloqueadoPor.includes(emisor.toString())) {
      // Quitamos
      usuarioPerfil.bloqueadoPor.pull(emisor.toString())
    } else {
      // Agregamos
      usuarioPerfil.bloqueadoPor.push(emisor.toString())
    }

    // No existe la conversacion bloqueada agregamos el emisor que bloqueda
    if (!conversacion.bloqueado) {
      conversacion.bloqueadoPor = emisor
    } else {
      conversacion.bloqueadoPor = ''
    }

    // Bloqueo
    conversacion.bloqueado = !conversacion.bloqueado

    if (conversacion.eliminadoPor.length !== 2) {
      // CREAMOS LA NOTIFICACION
      const notificacion = await crearNotificacion({
        receptor,
        texto: `${req.usuario.usuario} , Te ${conversacion.bloqueado ? 'Bloqueo' : 'Desbloqueo'} la conversación. link*=${`/conversacion/${conversacionId}/mensajes/${receptor}/${emisor}`}=ver-conversación`
      })

      // Generamos el ultimo mensaje
      conversacion.ultimoMensaje = {
        usuarioId: emisor,
        texto: `${conversacion.bloqueado ? 'Chat Bloqueado' : 'Chat Desbloqueado'}`,
        isfoto: false
      }

      // Guardar
      await Promise.all([conversacion.save(), usuarioPerfil.save()])

      // Enviar respuesta
      return res.json({ message: conversacion.bloqueado ? 'bloqueado' : 'Desbloqueado', conversacion, notificacion })
    }

    // Generamos el ultimo mensaje vacio
    conversacion.ultimoMensaje = {
      usuarioId: '',
      texto: '',
      isfoto: false
    }

    // Guardar
    await Promise.all([conversacion.save(), usuarioPerfil.save()])

    // Enviar respuesta
    return res.json({ message: conversacion.bloqueado ? 'bloqueado' : 'Desbloqueado', conversacion })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}
