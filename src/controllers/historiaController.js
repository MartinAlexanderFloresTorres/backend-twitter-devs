import Historia from '../models/Historia.js'
import isValidId from '../helpers/isValidId.js'
import writeImagenVideo from '../helpers/writeImagenVideo.js'
import deleteFile from '../cloudinary/deleteFile.js'
import crearNotificacion from '../notificaciones/crearNotificacion.js'
import deleteVideo from '../cloudinary/deleteVideo.js'
import suspenderCuenta from '../helpers/suspenderCuenta.js'

// CREAR
export const crear = async (req, res) => {
  try {
    const { usuario } = req
    const { texto } = req.body

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }

    if (texto) {
      const palabraSuspender = await suspenderCuenta(texto, usuario)
      // VERIFICAR LAS PALABRAS ESCRITAS
      if (palabraSuspender) {
        return res.status(403).json({ message: `Has suspendido por 6 dias por escribir "${palabraSuspender}"` })
      }
    }

    // CREAR HISTORIA
    const historia = new Historia({
      creador: usuario._id,
      texto: texto
    })

    // EXISTE ARCHIVO
    if (req.files?.archivo) {
      // SUBIR A CLOUDINARY
      const archivo = await writeImagenVideo(req.files.archivo, req.body.tipo, 'clon-twitter/archivos-estados')
      // ESCRIBIMOS
      historia.archivo = {
        data: archivo,
        tipo: req.body.tipo
      }
    }

    // GUARDAMOS LAS HISTORIAS EN EL USUARIO
    usuario.historias.push(historia._id)

    // GUARDAMOS
    await Promise.all([historia.save(), usuario.save()])

    // ENVIAR RESPUESTA
    res.json({ message: 'Creado' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER HISTORIAS DE LOS SEGUIDORES DEL USUARIO
export const obtenerHistoriasSeguidores = async (req, res) => {
  try {
    const { usuario } = req

    // Obtener una lista de los ids de los seguidos del usuario
    const idsSeguidos = usuario.seguidos.map((seguidor) => seguidor._id)

    // Obtener las historias de los seguidos del usuario
    const historias = await Historia.find({
      creador: { $in: [...idsSeguidos, usuario._id] }
    })
      .populate('creador', 'usuario nombre avatar suspendido')
      .select('_id vistosPor')

    // Agrupar las historias por seguidor en un array de historias [{}, {}]
    const historiasPorSeguidor = historias.reduce((acc, historia) => {
      const creadorId = historia.creador._id.toString()
      const index = acc.findIndex((historia) => historia.creador._id.toString() === creadorId)
      if (index !== -1) {
        acc[index].historias.push(historia)
      } else {
        acc.push({
          creador: historia.creador,
          historias: [historia]
        })
      }
      return acc
    }, [])

    // Ordenar las historias por creador, poniendo primero la del usuario
    historiasPorSeguidor.sort((a, b) => {
      const aCreadorId = a.creador._id.toString()
      const bCreadorId = b.creador._id.toString()
      if (aCreadorId === usuario._id.toString()) {
        return -1
      } else if (bCreadorId === usuario._id.toString()) {
        return 1
      } else {
        return 0
      }
    })

    res.json({ historias: historiasPorSeguidor })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER HISTORIAS DEL USUARIO
export const obtenerHistoriasUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params

    // Obtener las historias de los seguidos del usuario
    const historias = await Historia.find({ creador: usuarioId }).populate('creador', 'usuario nombre avatar suspendido')

    // ENVIAR RESPUESTA
    res.json(historias)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER HISTORIA
export const obtenerHistoria = async (req, res) => {
  try {
    const { historiaId } = req.params

    // VALIDAR ID
    if (!isValidId(historiaId)) return res.status(400).json({ message: 'ID no valido' })

    // Obtener la historia
    const historia = await Historia.findById(historiaId).populate('creador', 'usuario nombre avatar suspendido').populate('vistosPor', 'usuario nombre avatar suspendido')

    // NO EXISTE
    if (!historia) return res.status(400).json({ message: 'La historia no existe' })

    // ENVIAR RESPUESTA
    res.json(historia)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ELIMINAR HISTORIA
export const eliminarHistoria = async (req, res) => {
  try {
    const { usuario } = req
    const { id } = req.params

    // VALIDAR ID
    if (!isValidId(id)) return res.status(400).json({ message: 'ID no valido' })

    // BUSCAR HISTORIA
    const historia = await Historia.findById(id)

    // NO EXISTE
    if (!historia) return res.status(400).json({ message: 'La historia no existe' })

    // NO ES EL CREADOR
    if (historia.creador.toString() !== usuario._id.toString()) return res.status(403).json({ message: 'No tiene permisos' })

    // ELIMINAR ARCHIVO DE CLOUDINARY
    if (historia.archivo.data?.public_id) {
      if (historia.archivo.tipo === 'video') {
        await deleteVideo({ public_id: historia.archivo.data.public_id, folder: 'clon-twitter/archivos-estados' })
      } else {
        await deleteFile({ public_id: historia.archivo.data.public_id, folder: 'clon-twitter/archivos-estados' })
      }
    }

    // ELIMINAMOS LA HISTORIA EN EL USUARIO
    usuario.historias.pull(historia._id)

    // GUARDAR
    await Promise.all([historia.deleteOne(), usuario.save()])

    // ENVIAR RESPUESTA
    res.json({ message: 'Historia Eliminada' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// VISTO HISTORIA
export const vistoHistoria = async (req, res) => {
  try {
    const { usuario } = req
    const { id } = req.params

    // VALIDAR ID
    if (!isValidId(id)) return res.status(400).json({ message: 'ID no valido' })

    // BUSCAR HISTORIA
    const historia = await Historia.findById(id)

    // NO EXISTE
    if (!historia) return res.status(400).json({ message: 'La historia no existe' })

    // VISTOS
    if (!historia.vistosPor.includes(usuario._id.toString())) {
      historia.vistosPor.push(usuario._id)
      // GUARDAR
      const historiaGuardada = await historia.save()
      // ENVIAR RESPUESTA
      return res.json(historiaGuardada)
    }

    res.status(200)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// HEART HISTORIA
export const heart = async (req, res) => {
  try {
    const { usuario } = req
    const { historiaId } = req.params

    // VALIDAR ID
    if (!isValidId(historiaId)) return res.status(400).json({ message: 'ID no valido' })

    // Si el usuario esta suspendido
    if (usuario.suspendido) {
      return res.status(403).json({ message: `Esta suspendido por 6 dias` })
    }

    // BUSCAR HISTORIA
    const historia = await Historia.findById(historiaId).populate('creador', 'usuario nombre avatar suspendido')

    // NO EXISTE
    if (!historia) return res.status(400).json({ message: 'La historia no existe' })

    const existe = historia.hearts.includes(usuario._id.toString())

    // VISTOS
    if (existe) {
      // QUITAMOS
      historia.hearts.pull(usuario._id)
    } else {
      // AGREGAMOS
      historia.hearts.push(usuario._id)
    }
    // GUARDAR
    const historisGuardada = await historia.save()

    // CREAMOS LA NOTIFICACION
    const notificacion = await crearNotificacion({
      receptor: historia.creador._id,
      texto: `${usuario.usuario} , ${existe ? 'le quito el me encanta ❤' : 'le dio me encanta ❤'} de tu estado`
    })

    // ENVIAR RESPUESTA
    return res.json({ message: existe ? 'Quitado' : 'Le diste me encanta', historia: historisGuardada, notificacion })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}
