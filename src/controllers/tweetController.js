import Tweet from '../models/Tweet.js'
import Usuario from '../models/Usuario.js'
import deleteFile from '../cloudinary/deleteFile.js'
import isValidId from '../helpers/isValidId.js'
import writeImagen from '../helpers/writeImagen.js'
import Comentario from '../models/Comentario.js'
import crearNotificacion from '../notificaciones/crearNotificacion.js'
import suspenderCuenta from '../helpers/suspenderCuenta.js'

// CREAR
export const crear = async (req, res) => {
  try {
    const { usuario } = req

    const { descripcion, hashtags, menciones } = req.body

    // Validar
    if (!descripcion) return res.status(400).json({ message: 'Todos los campos son obligatorios' })

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }
    const palabraSuspender = await suspenderCuenta(descripcion, usuario)
    // VERIFICAR LAS PALABRAS ESCRITAS
    if (palabraSuspender) {
      return res.status(403).json({ message: `Has suspendido por 6 dias por escribir "${palabraSuspender}"` })
    }

    // crear tweet
    const tweet = new Tweet({ descripcion, creador: usuario._id })

    // EXISTE HASHTAGS
    if (hashtags) {
      tweet.hashtags = hashtags.split(',')
    }
    // EXISTE MENCIONES
    if (menciones) {
      tweet.menciones = menciones.split(',')
    }

    // Existe foto
    if (req?.files?.foto) {
      const foto = await writeImagen(req.files.foto, 'clon-twitter/tweets-fotos')
      tweet.foto = foto
    }

    // Guardar el tweet
    const tweetGuardado = await tweet.save()
    const tweetObtenido = await Tweet.findById(tweetGuardado._id).populate('creador', 'usuario nombre suspendido bloqueadoPor avatar').populate('menciones', 'avatar nombre usuario')

    // EMITIR NOTIFICACIONES
    if (tweetObtenido.menciones.length > 0) {
      // Obtener las menciones que no sean el usuario creador
      const mencionesReceptores = tweetObtenido.menciones.filter((m) => m._id.toString() !== usuario._id.toString())

      // array de notificaciones
      const notificaciones = await Promise.all(
        mencionesReceptores.map(async (receptor) => {
          return await crearNotificacion({
            receptor: receptor._id,
            texto: `¡Hola ${receptor.usuario} !. El usuario ${usuario.usuario} te mencionó en su tweet. ¡Echa un vistazo aquí: link*=/tweet/${tweetObtenido._id}=ver-tweet !`
          })
        })
      )

      // Enviar respuesta
      return res.json({ message: 'Tweet Creado exitosamente', tweet: tweetObtenido, notificaciones })
    }

    // Enviar respuesta
    res.json({ message: 'Tweet Creado exitosamente', tweet: tweetObtenido })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// CREAR
export const ReTweetcrear = async (req, res) => {
  try {
    const { usuario } = req
    const { tweetId } = req.params

    const { descripcion, hashtags, menciones } = req.body

    // Validar
    if (!descripcion) return res.status(400).json({ message: 'Todos los campos son obligatorios' })

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }

    const palabraSuspender = await suspenderCuenta(descripcion, usuario)
    // VERIFICAR LAS PALABRAS ESCRITAS
    if (palabraSuspender) {
      return res.status(403).json({ message: `Has suspendido por 6 dias por escribir "${palabraSuspender}"` })
    }

    // crear tweet
    const tweet = new Tweet({
      descripcion,
      creador: usuario._id,
      retweet: {
        tweetId,
        usuarioId: usuario._id
      }
    })

    // EXISTE HASHTAGS
    if (hashtags) {
      tweet.hashtags = hashtags.split(',')
    }
    // EXISTE MENCIONES
    if (menciones) {
      tweet.menciones = menciones.split(',')
    }

    // Existe foto
    if (req?.files?.foto) {
      const foto = await writeImagen(req.files.foto, 'clon-twitter/tweets-fotos')
      tweet.foto = foto
    }

    // Guardar el tweet
    const tweetGuardado = await tweet.save()
    const tweetObtenido = await Tweet.findById(tweetGuardado._id)
      .populate('creador', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('menciones', 'avatar nombre usuario')
      .populate('retweet.usuarioId', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate({
        path: 'retweet.tweetId',
        select: 'descripcion foto creador menciones createdAt',
        populate: [
          {
            path: 'creador',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          },
          {
            path: 'menciones',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          }
        ]
      })

    const igual = tweetObtenido.retweet.tweetId.creador._id.toString() === usuario._id.toString()

    const texto = igual
      ? `¡Hey! ¡Tu Tweet ha sido retuiteado! Y lo mejor es que lo has hecho tú mismo. ¡Buen trabajo. link*=/tweet/${tweetObtenido._id}=ver-mi-retweet .`
      : `¡Hola! Me alegra informarte que el usuario ${usuario.usuario} ha retuiteado uno de tus tweets recientemente. ¡Es genial ver que tu contenido está siendo compartido! Puedes ver el tweet retuiteado en este enlace: link*=/tweet/${tweetObtenido._id}=ver-retweet . ¡Sigue publicando contenido interesante y útil!`

    // CREAMOS LA NOTIFACION
    const notificacionGuardada = await crearNotificacion({
      receptor: tweetObtenido.retweet.tweetId.creador._id,
      texto
    })

    // Enviar respuesta
    res.json({ message: 'Tweet Creado exitosamente', tweet: tweetObtenido, notificacion: notificacionGuardada })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// EDITAR
export const editar = async (req, res) => {
  try {
    const { usuario } = req
    const { id } = req.params

    const { descripcion, eliminado, hashtags, menciones } = req.body

    // Validar
    if (!descripcion) return res.status(400).json({ message: 'Todos los campos son obligatorios' })

    // Id valido
    if (!isValidId(id)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }
    const palabraSuspender = await suspenderCuenta(descripcion, usuario)
    // VERIFICAR LAS PALABRAS ESCRITAS
    if (palabraSuspender) {
      return res.status(403).json({ message: `Has suspendido por 6 dias por escribir "${palabraSuspender}"` })
    }

    // crear tweet
    const tweet = await Tweet.findById(id).populate('creador', 'usuario nombre suspendido bloqueadoPor avatar').populate('hearts', 'usuario nombre suspendido bloqueadoPor avatar')

    // Es el creador
    if (tweet.creador._id.toString() !== usuario._id.toString()) return res.status(402).json({ message: 'No tienes permisos' })

    // EXISTE HASHTAGS
    if (hashtags) {
      tweet.hashtags = hashtags.split(',')
    } else {
      tweet.hashtags = []
    }
    // EXISTE MENCIONES
    if (menciones) {
      tweet.menciones = menciones.split(',')
    } else {
      tweet.menciones = []
    }

    // Existe foto
    if (req?.files?.foto) {
      // Eliminar la foto de cloudinary
      if (tweet.foto) {
        const [foto] = await Promise.all([writeImagen(req.files.foto, 'clon-twitter/tweets-fotos'), deleteFile({ public_id: tweet.foto.public_id, folder: 'clon-twitter/tweets-fotos' })])
        // Guardar la nueva foto
        tweet.foto = foto
      } else {
        const foto = await writeImagen(req.files.foto, 'clon-twitter/tweets-fotos')
        // Guardar la nueva foto
        tweet.foto = foto
      }
    } else if (eliminado === 'true') {
      if (tweet.foto) {
        // Eliminar la foto de cloudinary
        await deleteFile({ public_id: tweet.foto.public_id, folder: 'clon-twitter/tweets-fotos' })
        // Eliminar la foto
        tweet.foto = null
      }
    }

    // Actualizar datos
    tweet.descripcion = descripcion

    // Guardar el tweet
    const tweetGuardado = await tweet.save()
    const tweetObtenido = await Tweet.findById(tweetGuardado._id)
      .populate('creador', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('hearts', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('menciones', 'avatar nombre usuario')
      .populate('retweet.usuarioId', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate({
        path: 'retweet.tweetId',
        select: 'descripcion foto creador menciones createdAt',
        populate: [
          {
            path: 'creador',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          },
          {
            path: 'menciones',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          }
        ]
      })

    // EMITIR NOTIFICACIONES
    if (tweetObtenido.menciones.length > 0) {
      // Obtener las menciones que no sean el usuario creador
      const mencionesReceptores = tweetObtenido.menciones.filter((m) => m._id.toString() !== usuario._id.toString())

      // array de notificaciones
      const notificaciones = await Promise.all(
        mencionesReceptores.map(async (receptor) => {
          return await crearNotificacion({
            receptor: receptor._id,
            texto: `¡Hola ${receptor.usuario} !. El usuario ${usuario.usuario} te mencionó en su tweet. ¡Echa un vistazo aquí: link*=/tweet/${tweetObtenido._id}=ver-tweet !`
          })
        })
      )

      // Enviar respuesta
      return res.json({ message: 'Tweet Actualizado', tweet: tweetObtenido, notificaciones })
    }

    // Enviar respuesta
    res.json({ message: 'Tweet Actualizado', tweet: tweetObtenido })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// MOSTRAR
export const mostrar = async (req, res) => {
  try {
    // agregar la paginacion de mongoose-paginate-v2
    const page = parseInt(req.query.page) || 1

    const limit = parseInt(req.query.limit) || 10

    // Obtener tweets con paginación y populates
    const options = {
      page,
      limit,
      populate: [
        { path: 'creador', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        { path: 'hearts', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        { path: 'menciones', select: 'avatar nombre usuario' },
        { path: 'retweet.usuarioId', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        {
          path: 'retweet.tweetId',
          select: 'descripcion foto creador menciones createdAt',
          populate: [
            { path: 'creador', select: 'usuario nombre suspendido bloqueadoPor avatar' },
            { path: 'menciones', select: 'usuario nombre suspendido bloqueadoPor avatar' }
          ]
        }
      ],
      sort: { createdAt: -1 }
    }

    // Obtener tweets
    const data = await Tweet.paginate({}, options)

    // Enviar Respuesta
    res.json(data)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// MOSTRAR TWEETS USUARIO
export const mostrarTweetsUsuario = async (req, res) => {
  try {
    // creador
    const { creador } = req.params

    // agregar la paginacion de mongoose-paginate-v2
    const page = parseInt(req.query.page) || 1

    const limit = parseInt(req.query.limit) || 10

    // Obtener tweets con paginación y populates
    const options = {
      page,
      limit,
      populate: [
        { path: 'creador', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        { path: 'hearts', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        { path: 'menciones', select: 'avatar nombre usuario' },
        { path: 'retweet.usuarioId', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        {
          path: 'retweet.tweetId',
          select: 'descripcion foto creador menciones createdAt',
          populate: [
            { path: 'creador', select: 'usuario nombre suspendido bloqueadoPor avatar' },
            { path: 'menciones', select: 'usuario nombre suspendido bloqueadoPor avatar' }
          ]
        }
      ],
      sort: { createdAt: -1 }
    }

    // Obtener tweets
    const data = await Tweet.paginate({ creador }, options)

    // Enviar Respuesta
    res.json(data)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// MOSTRAR TWEETS BUSQUEDA
export const mostrarTweetsBusqueda = async (req, res) => {
  try {
    // agregar la paginacion de mongoose-paginate-v2
    const page = parseInt(req.query.page) || 1

    const limit = parseInt(req.query.limit) || 10
    const { q } = req.query

    const regex = new RegExp(q, 'i')

    // Obtener tweets con paginación y populates
    const options = {
      page,
      limit,
      populate: [
        { path: 'creador', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        { path: 'hearts', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        { path: 'menciones', select: 'avatar nombre usuario' },
        { path: 'retweet.usuarioId', select: 'usuario nombre suspendido bloqueadoPor avatar' },
        {
          path: 'retweet.tweetId',
          select: 'descripcion foto creador menciones createdAt',
          populate: [
            { path: 'creador', select: 'usuario nombre suspendido bloqueadoPor avatar' },
            { path: 'menciones', select: 'usuario nombre suspendido bloqueadoPor avatar' }
          ]
        }
      ],
      sort: { createdAt: -1 }
    }

    const dataTweets = await Tweet.paginate(
      {
        $or: [{ descripcion: regex }, { creador: { $in: await Usuario.find({ usuario: regex }) } }]
      },
      options
    )

    // Obtener usuarios
    const usuarios = await Usuario.find({ $or: [{ usuario: regex }, { nombre: regex }], confirmado: true })
      .select('avatar nombre usuario')
      .limit(20)

    // Enviar Respuesta
    res.json({ dataTweets, usuarios })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER TWEET ID
export const obtenerTweet = async (req, res) => {
  try {
    const { id } = req.params

    // Id valido
    if (!isValidId(id)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Obtener tweet
    const tweet = await Tweet.findById(id)
      .populate('creador', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('hearts', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('menciones', 'avatar nombre usuario')
      .populate('comentarios.usuario', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('retweet.usuarioId', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate({
        path: 'retweet.tweetId',
        select: 'descripcion foto creador menciones createdAt',
        populate: [
          {
            path: 'creador',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          },
          {
            path: 'menciones',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          }
        ]
      })

    if (!tweet) return res.status(404).json({ message: 'Tweet no encontrado' })

    // Enviar respuesta
    res.json(tweet)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ELIMINAR TWEET
export const eliminarTweet = async (req, res) => {
  try {
    const { usuario } = req
    const { id } = req.params

    // Id valido
    if (!isValidId(id)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Obtener tweet
    const tweet = await Tweet.findById(id)

    // Existe
    if (!tweet) return res.status(404).json({ message: 'Tweet no encontrado' })

    // Es el creador
    if (tweet.creador.toString() !== usuario._id.toString()) return res.status(402).json({ message: 'No tienes permisos' })

    // Eliminar la foto
    if (tweet.foto) {
      // Eliminar de cloudinary
      await deleteFile({ public_id: tweet.foto.public_id, folder: 'clon-twitter/tweets-fotos' })
    }

    // Eliminar comentarios
    const comentarios = await Comentario.find({ tweet: tweet._id })

    if (comentarios.length > 0) {
      await Promise.all(
        comentarios.map(async (comentario) => {
          // Eliminar la foto de cloudinarys
          if (comentario.foto) {
            await deleteFile({ public_id: comentario.foto.public_id, folder: 'clon-twitter/comentarios-fotos' })
          }

          // Eliminar
          await comentario.deleteOne()
        })
      )
    }

    // Eliminar el tweet guardado de cada usuario y  Eliminar tweet
    await Promise.all([Usuario.updateMany({ guardados: { $in: [tweet._id] } }, { $pull: { guardados: tweet._id } }), tweet.deleteOne()])

    // Enviar Respuesta
    res.json({ message: 'Tweet eliminado exitosamente' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// HEARTS
export const hearts = async (req, res) => {
  try {
    const { id } = req.params
    const { usuario } = req

    // Id valido
    if (!isValidId(id)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }

    // Obtener el tweet
    const tweet = await Tweet.findById(id)
      .populate('creador', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('hearts', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('menciones', 'avatar nombre usuario')
      .populate('comentarios.usuario', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate('retweet.usuarioId', 'usuario nombre suspendido bloqueadoPor avatar')
      .populate({
        path: 'retweet.tweetId',
        select: 'descripcion foto creador menciones createdAt',
        populate: [
          {
            path: 'creador',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          },
          {
            path: 'menciones',
            select: 'usuario nombre suspendido bloqueadoPor avatar'
          }
        ]
      })

    // Existe el tweet
    if (!tweet) return res.status(400).json({ message: 'El tweet no existe' })

    const existe = tweet.hearts.some((t) => t._id.toString() === usuario._id.toString())

    let textoNotificacion = null

    // Agregar o Quitar hearts
    if (existe) {
      tweet.hearts.pull(usuario._id)
      // Notificacion al usuario que no sea el creador
      if (tweet.creador._id.toString() !== usuario._id.toString()) {
        textoNotificacion = `${usuario.usuario} le ha quitado su reacción de me encanta ❤ de tu link*=/tweet/${tweet._id}=tweet`
      }
    } else {
      // El usuario esta en el array de bloqueadosPor[]
      if (usuario.bloqueadoPor.includes(tweet.creador._id.toString())) return res.status(403).json({ message: 'El usuario te mantiene bloqueado' })
      // El usuario creador el tweet esta en el array de bloqueadosPor[]
      if (tweet.creador.bloqueadoPor.includes(usuario._id.toString())) return res.status(403).json({ message: `Mantienes bloqueado a ${tweet.creador.nombre}` })

      // Notificacion al usuario que no sea el creador
      if (tweet.creador._id.toString() !== usuario._id.toString()) {
        // Nueva notificacion
        textoNotificacion = `${usuario.usuario} le ha encantado ❤ tu link*=/tweet/${tweet._id}=tweet`
      }

      tweet.hearts.push(usuario._id)
    }

    // EXISTE UN TEXTO PARA LA NOTIFICACION
    if (textoNotificacion) {
      // CREAMOS LA NOTIFICACION
      const notificacionGuardado = await crearNotificacion({
        receptor: tweet.creador._id,
        texto: textoNotificacion
      })

      const [tweetGuardado] = await Promise.all([(await tweet.save()).populate('hearts', 'usuario nombre suspendido bloqueadoPor avatar')])
      return res.json({ tweet: tweetGuardado, notificacion: notificacionGuardado })
    }

    const [tweetGuardado] = await Promise.all([(await tweet.save()).populate('hearts', 'usuario nombre suspendido bloqueadoPor avatar')])
    res.json({ tweet: tweetGuardado })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}
