import Tweet from '../models/Tweet.js'
import deleteFile from '../cloudinary/deleteFile.js'
import isValidId from '../helpers/isValidId.js'
import writeImagen from '../helpers/writeImagen.js'
import Comentario from '../models/Comentario.js'
import crearNotificacion from '../notificaciones/crearNotificacion.js'
import suspenderCuenta from '../helpers/suspenderCuenta.js'

// OBTENER COMENTARIOS
export const obtenerComentarios = async (req, res) => {
  try {
    const { tweetId } = req.params

    // Id valido
    if (!isValidId(tweetId)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Obtener el tweet
    const tweet = await Tweet.findById(tweetId)

    // Existe el tweet
    if (!tweet) return res.status(400).json({ message: 'El tweet no existe' })

    // Creamos el comentario
    const comentarios = await Comentario.find({ tweet: tweet._id }).populate('menciones', 'usuario').populate('creador', 'avatar nombre usuario')

    // Enviar respuesta
    res.json(comentarios)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// NUEVO COMENTARIO
export const nuevoComentario = async (req, res) => {
  try {
    const { tweetId } = req.params
    const { usuario } = req
    const { texto, menciones } = req.body

    // validar
    if (!texto) return res.status(400).json({ message: 'El texto es obligatorio' })

    // Id valido
    if (!isValidId(tweetId)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }

    const palabraSuspender = await suspenderCuenta(texto, usuario)
    // VERIFICAR LAS PALABRAS ESCRITAS
    if (palabraSuspender) {
      return res.status(403).json({ message: `Has suspendido por 6 dias por escribir "${palabraSuspender}"` })
    }

    // Obtener el tweet
    const tweet = await Tweet.findById(tweetId).populate('creador', 'usuario nombre suspendido bloqueadoPor avatar')

    // Existe el tweet
    if (!tweet) return res.status(400).json({ message: 'El tweet no existe' })

    // El usuario esta en el array de bloqueadosPor[]
    if (usuario.bloqueadoPor.includes(tweet.creador._id.toString())) return res.status(403).json({ message: 'El usuario te mantiene bloqueado' })
    // El usuario creador el tweet esta en el array de bloqueadosPor[]
    if (tweet.creador.bloqueadoPor.includes(usuario._id.toString())) return res.status(403).json({ message: `Mantienes bloqueado a ${tweet.creador.nombre}` })

    // Creamos el comentario
    const comentario = new Comentario({
      creador: usuario._id,
      tweet: tweet._id,
      texto
    })

    // MENCIONES
    if (menciones) {
      comentario.menciones = menciones.split(',')
    }

    // Existe foto
    if (req?.files?.foto) {
      const foto = await writeImagen(req.files.foto, 'clon-twitter/comentarios-fotos')
      // EXISTE MENCIONES
      comentario.foto = foto
    }

    // Agregamos el id del comentario en el tweet
    tweet.comentarios.push(comentario._id)

    // Notificacion al usuario que no sea el creador
    if (tweet.creador._id.toString() !== usuario._id.toString()) {
      // CREAMOS LA NOTIFICACION
      const notificacionGuardado = await crearNotificacion({
        receptor: tweet.creador._id,
        texto: `${usuario.usuario}, A comentado tu tweet. link*=/tweet/${tweet._id}#${comentario._id}=ver-comentario`
      })

      await Promise.all([comentario.save(), tweet.save()])
      // OBTENEMOS EL COMENTARIO RECIENTE
      const comentarioReciente = await Comentario.findById(comentario._id).populate('creador', 'avatar nombre usuario').populate('menciones', 'usuario')

      // EMITIR NOTIFICACIONES
      if (comentarioReciente.menciones.length > 0) {
        // Obtener las menciones que no sean el usuario creador
        const mencionesReceptores = comentarioReciente.menciones.filter((m) => m._id.toString() !== usuario._id.toString())

        // array de notificaciones
        const notificaciones = await Promise.all(
          mencionesReceptores.map(async (receptor) => {
            return await crearNotificacion({
              receptor: receptor._id,
              texto: `¡Hola ${receptor.usuario} !. El usuario ${usuario.usuario} te mencionó en  un comentario en el tweet. ¡Echa un vistazo aquí: link*=/tweet/${tweet._id}#${tweet._id}=ver-tweet !`
            })
          })
        )
        return res.json({ message: 'Comentario Agregado', comentario: comentarioReciente, notificacion: notificacionGuardado, notificaciones })
      }

      return res.json({ message: 'Comentario Agregado', comentario: comentarioReciente, notificacion: notificacionGuardado })
    }

    await Promise.all([comentario.save(), tweet.save()])
    // OBTENEMOS EL COMENTARIO RECIENTE
    const comentarioReciente = await Comentario.findById(comentario._id).populate('creador', 'avatar nombre usuario').populate('menciones', 'usuario')

    // EMITIR NOTIFICACIONES
    if (comentarioReciente.menciones.length > 0) {
      // Obtener las menciones que no sean el usuario creador
      const mencionesReceptores = comentarioReciente.menciones.filter((m) => m._id.toString() !== usuario._id.toString())

      // array de notificaciones
      const notificaciones = await Promise.all(
        mencionesReceptores.map(async (receptor) => {
          return await crearNotificacion({
            receptor: receptor._id,
            texto: `¡Hola ${receptor.usuario} !. El usuario ${usuario.usuario} te mencionó en  un comentario en el tweet. ¡Echa un vistazo aquí: link*=/tweet/${tweet._id}#${tweet._id}=ver-tweet !`
          })
        })
      )
      return res.json({ message: 'Comentario Agregado', comentario: comentarioReciente, notificaciones })
    }

    res.json({ message: 'Comentario Agregado', comentario: comentarioReciente })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ELIMINAR COMENTARIO
export const eliminarComentario = async (req, res) => {
  try {
    const { usuario } = req
    const { comentarioId, tweetId } = req.params

    // Id valido
    if (!isValidId(tweetId)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Id valido
    if (!isValidId(comentarioId)) return res.status(400).json({ message: 'ID comentario no valido' })

    // Obtener el tweet
    const tweet = await Tweet.findById(tweetId)

    // Existe el tweet
    if (!tweet) return res.status(400).json({ message: 'El tweet no existe' })

    // Existe el comentario
    const existeComentario = tweet.comentarios.includes(comentarioId.toString())

    if (!existeComentario) {
      return res.status(400).json({ message: 'El comentario  no existe' })
    }

    // Obtenemos el comentario
    const comentario = await Comentario.findById(comentarioId)

    // Es creador
    if (comentario.creador.toString() !== usuario._id.toString() && tweet.creador.toString() !== usuario._id.toString()) {
      return res.status(403).json({ message: 'No tiene permisos' })
    }

    // Eliminar la foto
    if (comentario.foto) {
      // Eliminar de cloudinary
      await deleteFile({ public_id: comentario.foto.public_id, folder: 'clon-twitter/comentarios-fotos' })
    }

    // Quitar del array
    tweet.comentarios.pull(comentarioId)

    // Guardar tweet
    await Promise.all([comentario.deleteOne(), tweet.save()])

    res.json({ message: 'Comentario eliminado' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// EDITAR COMENTARIO
export const editarComentario = async (req, res) => {
  try {
    const { usuario } = req
    const { comentarioId, tweetId } = req.params
    const { texto, menciones, eliminado } = req.body

    // validar
    if (!texto) return res.status(400).json({ message: 'El texto es obligatorio' })

    // Id valido
    if (!isValidId(tweetId)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Id valido
    if (!isValidId(comentarioId)) return res.status(400).json({ message: 'ID comentario no valido' })

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }

    const palabraSuspender = await suspenderCuenta(texto, usuario)
    // VERIFICAR LAS PALABRAS ESCRITAS
    if (palabraSuspender) {
      return res.status(403).json({ message: `Has suspendido por 6 dias por escribir "${palabraSuspender}"` })
    }

    // Obtener el tweet
    const tweet = await Tweet.findById(tweetId).populate('creador', 'bloqueadoPor nombre')

    // Existe el tweet
    if (!tweet) return res.status(400).json({ message: 'El tweet no existe' })

    // Obtenemos el comentario
    const comentario = await Comentario.findById(comentarioId)

    // Existe el comentario
    if (!comentario) return res.status(400).json({ message: 'El comentario no existe' })

    // El usuario esta en el array de bloqueadosPor[]
    if (usuario.bloqueadoPor.includes(tweet.creador._id.toString())) return res.status(403).json({ message: 'El usuario te mantiene bloqueado' })
    // El usuario creador el tweet esta en el array de bloqueadosPor[]
    if (tweet.creador.bloqueadoPor.includes(usuario._id.toString())) return res.status(403).json({ message: `Mantienes bloqueado a ${tweet.creador.nombre}` })

    // Guardamos el texto
    comentario.texto = texto

    // MENCIONES
    if (menciones) {
      comentario.menciones = menciones.split(',')
    }

    // No es creador
    if (comentario.creador.toString() !== usuario._id.toString()) {
      return res.status(403).json({ message: 'No tiene permisos' })
    }

    // Existe foto
    if (req?.files?.foto) {
      // Eliminar la foto de cloudinary
      if (comentario.foto) {
        const [foto] = await Promise.all([writeImagen(req.files.foto, 'clon-twitter/comentarios-fotos'), deleteFile({ public_id: comentario.foto.public_id, folder: 'clon-twitter/comentarios-fotos' })])
        comentario.foto = foto
      } else {
        comentario.foto = await writeImagen(req.files.foto, 'clon-twitter/comentarios-fotos')
      }
    } else if (eliminado === 'true') {
      if (comentario.foto) {
        // Eliminar la foto de cloudinary
        await deleteFile({ public_id: comentario.foto.public_id, folder: 'clon-twitter/comentarios-fotos' })
        comentario.foto = null
      }
    }

    // Guardar comentario
    await comentario.save()

    // OBTENEMOS EL COMENTARIO RECIENTE
    const comentarioReciente = await Comentario.findById(comentario._id).populate('creador', 'avatar nombre usuario').populate('menciones', 'usuario')

    // EMITIR NOTIFICACIONES
    if (comentarioReciente.menciones.length > 0) {
      // Obtener las menciones que no sean el usuario creador
      const mencionesReceptores = comentarioReciente.menciones.filter((m) => m._id.toString() !== usuario._id.toString())

      // array de notificaciones
      const notificaciones = await Promise.all(
        mencionesReceptores.map(async (receptor) => {
          return await crearNotificacion({
            receptor: receptor._id,
            texto: `¡Hola ${receptor.usuario} !. El usuario ${usuario.usuario} te mencionó en  un comentario en el tweet. ¡Echa un vistazo aquí: link*=/tweet/${tweet._id}#${tweet._id}=ver-tweet !`
          })
        })
      )
      return res.json({ message: 'Comentario actualizado', comentario: comentarioReciente, notificaciones })
    }

    res.json({ message: 'Comentario actualizado', comentario: comentarioReciente })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}
