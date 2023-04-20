import Usuario from '../models/Usuario.js'
import Tweet from '../models/Tweet.js'
import deleteFile from '../cloudinary/deleteFile.js'
import emailRecuperacion from '../emails/emailRecuperacion.js'
import emailRegistro from '../emails/emailRegistro.js'
import generarId from '../helpers/generarId.js'
import generarJWT from '../helpers/generarJWT.js'
import isValidId from '../helpers/isValidId.js'
import writeImagen from '../helpers/writeImagen.js'
import crearNotificacion from '../notificaciones/crearNotificacion.js'
import suspenderCuenta from '../helpers/suspenderCuenta.js'

// CREAR
export const crear = async (req, res) => {
  try {
    const { nombre, usuario, nacimiento, email, password } = req.body

    // Validar
    if (!nombre || !usuario || !nacimiento || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' })
    }

    // Validar email o usuario
    const existe = await Usuario.findOne({ $or: [{ email }, { usuario }] })

    if (existe) {
      return res.status(400).json({ message: 'El email o usuario ya existe' })
    }

    // Crear usuario
    const usuarioCreado = new Usuario({
      nombre,
      nacimiento,
      email,
      password,
      usuario,
      tokenConfirmacion: generarId()
    })

    // Guardar usuario
    await usuarioCreado.save()

    // Enviar email de confirmacion
    await emailRegistro({ email, nombre, token: usuarioCreado.tokenConfirmacion })

    // Enviar respuesta
    res.json({ message: 'Usuario creado correctamente, Revisa tu email para activar tu cuenta' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// COMFIRMAR
export const confirmar = async (req, res) => {
  try {
    const { token } = req.params

    console.log(token)

    // Validar
    if (!token) return res.status(400).json({ message: 'Token no valido' })

    // Buscar usuario
    const usuario = await Usuario.findOne({ tokenConfirmacion: token })

    if (!usuario) return res.status(400).json({ message: 'Token no valido' })

    // Actualizar usuario
    usuario.confirmado = true
    usuario.tokenConfirmacion = null

    // Guardar usuario
    await usuario.save()

    // Enviar respuesta
    res.json({ message: 'Usuario confirmado correctamente' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validar
    if (!email || !password) return res.status(400).json({ message: 'Todos los campos son obligatorios' })

    // Buscar usuario
    const usuario = await Usuario.findOne({ email })
      .populate('seguidores', '-password -token -confirmado -tokenConfirmacion -tokenPassword -seguidos -seguidores -guardados -nacimiento -email -descripcion -createdAt -banner -expiraTokenPassword -updatedAt -__v')
      .populate('seguidos', '-password -token -confirmado -tokenConfirmacion -tokenPassword -seguidos -seguidores -guardados -nacimiento -email -descripcion -createdAt -banner -expiraTokenPassword -updatedAt -__v')

    if (!usuario) return res.status(400).json({ message: 'El usuario no existe' })

    if (!usuario.confirmado) return res.status(400).json({ message: 'El email no ha sido confirmado' })

    // Validar password
    const passwordValido = await usuario.comprobarPassword(password)

    if (!passwordValido) return res.status(400).json({ message: 'La contraseña es incorrecta' })

    // Generar token
    const token = generarJWT(usuario._id)

    const respuesta = {
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        descripcion: usuario.descripcion,
        usuario: usuario.usuario,
        nacimiento: usuario.nacimiento,
        email: usuario.email,
        avatar: usuario.avatar,
        banner: usuario.banner,
        seguidores: usuario.seguidores,
        seguidos: usuario.seguidos,
        guardados: usuario.guardados,
        createdAt: usuario.createdAt,
        historias: usuario.historias,
        bloqueadoPor: usuario.bloqueadoPor,
        suspendido: usuario.suspendido
      },
      token
    }

    // Enviar respuesta
    res.json({ message: 'Bienvenido', ...respuesta })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

export const recuperar = async (req, res) => {
  try {
    const { email } = req.body

    // Validar
    if (!email) return res.status(400).json({ message: 'El email es son obligatorios' })

    // Buscar usuario
    const usuario = await Usuario.findOne({ email })

    if (!usuario) return res.status(400).json({ message: 'El usuario no existe' })

    // Generar token
    usuario.tokenPassword = generarId()
    // Expira en 5 minutos
    usuario.expiraTokenPassword = Date.now() + 1000 * 60 * 5

    // Guardar usuario
    await usuario.save()

    // Enviar email
    await emailRecuperacion({ email, nombre: usuario.nombre, token: usuario.tokenPassword })

    // Enviar respuesta
    res.json({ message: 'Hemos enviado un email para recuperar tu contraseña' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// VERIFICAR TOKEN
export const verificarToken = async (req, res) => {
  try {
    const { token } = req.params

    // Validar
    if (!token) return res.status(400).json({ message: 'Token no valido' })

    // Buscar usuario
    const usuario = await Usuario.findOne({ tokenPassword: token })

    if (!usuario) return res.status(400).json({ message: 'El usuario no existe' })

    // Validar expiracion
    if (Date.now() > usuario.expiraTokenPassword) {
      // Eliminar token
      usuario.tokenPassword = null
      usuario.expiraTokenPassword = null

      // Guardar usuario
      await usuario.save()
      return res.status(400).json({ message: 'El token ha expirado' })
    }

    // Enviar respuesta
    res.json({ message: 'Token valido' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// CAMBIAR PASSWORD
export const cambiarPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    // Validar
    if (!token || !password) return res.status(400).json({ message: 'Todos los campos son obligatorios' })

    // Buscar usuario
    const usuario = await Usuario.findOne({ tokenPassword: token })

    if (!usuario) return res.status(400).json({ message: 'El usuario no existe' })

    // Validar expiracion
    if (Date.now() > usuario.expiraTokenPassword) {
      // Eliminar token
      usuario.tokenPassword = null
      usuario.expiraTokenPassword = null

      // Guardar usuario
      await usuario.save()

      return res.status(400).json({ message: 'El token ha expirado' })
    }

    // Guardar password
    usuario.password = password

    // Eliminar token
    usuario.tokenPassword = null
    usuario.expiraTokenPassword = null

    // Guardar usuario
    await usuario.save()

    // Enviar respuesta
    res.json({ message: 'Contraseña cambiada correctamente' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER USUARIO
export const obtenerUsuario = async (req, res) => {
  try {
    const { usuario } = req
    res.json({ message: 'Usuario obtenido correctamente', usuario })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// BUSCAR USUARIOS
export const buscarUsuarios = async (req, res) => {
  try {
    const { usuario } = req

    // creador
    const { q } = req.query

    const regex = new RegExp(q, 'i')

    // Obtener usuarios
    const usuarios = await Usuario.find({ $or: [{ usuario: regex }, { nombre: regex }], confirmado: true, suspendido: false })
      .select('avatar nombre usuario bloqueadoPor')
      .limit(20)

    // Filtramos los usuarios no bloquedos
    const usuariosNoBloqueados = usuarios.filter((u) => !usuario.bloqueadoPor.includes(u._id.toString()) && !u.bloqueadoPor.includes(usuario._id.toString()))

    // Enviar Respuesta
    res.json(usuariosNoBloqueados)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

export const obtenerUsuarioHash = async (req, res) => {
  try {
    const { usuario } = req.params

    if (!usuario) return res.status(400).json({ message: 'Usuario no valido' })

    // Buscar usuario
    const existe = await Usuario.findOne({ usuario })
      .populate('seguidores', '-password -token -confirmado -tokenConfirmacion -tokenPassword -seguidos -seguidores -guardados -nacimiento -email -descripcion -createdAt -banner -expiraTokenPassword -updatedAt -__v')
      .populate('seguidos', '-password -token -confirmado -tokenConfirmacion -tokenPassword -seguidos -seguidores -guardados -nacimiento -email -descripcion -createdAt -banner -expiraTokenPassword -updatedAt -__v')

    if (!existe) return res.status(400).json({ message: 'El usuario no existe' })

    const respuesta = {
      usuario: {
        _id: existe._id,
        nombre: existe.nombre,
        descripcion: existe.descripcion,
        usuario: existe.usuario,
        nacimiento: existe.nacimiento,
        email: existe.email,
        avatar: existe.avatar,
        banner: existe.banner,
        seguidores: existe.seguidores,
        seguidos: existe.seguidos,
        guardados: existe.guardados,
        historias: existe.historias,
        bloqueadoPor: existe.bloqueadoPor,
        createdAt: existe.createdAt
      }
    }

    // Enviar respuesta
    res.json({ message: 'Usuario obtenido correctamente', ...respuesta })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// ACTUALIZAR
export const actualizar = async (req, res) => {
  try {
    const { id } = req.params
    const { usuario } = req

    const { nombre, usuario: usuarioArroba, nacimiento, email, descripcion } = req.body

    // Validar
    if (!nombre || !usuario || !nacimiento || !email || !descripcion) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' })
    }

    if (descripcion) {
      const palabraSuspender = await suspenderCuenta(descripcion, usuario)
      // VERIFICAR LAS PALABRAS ESCRITAS
      if (palabraSuspender) {
        return res.status(403).json({ message: `Has suspendido por 6 dias por escribir "${palabraSuspender}"` })
      }
    }

    // Validar usuario
    const existeUsuario = await Usuario.findOne({ usuario: usuarioArroba })
    if (existeUsuario && existeUsuario._id.toString() !== id) return res.status(400).json({ message: `${usuarioArroba} ya existe` })

    // Validar email
    const existeEmail = await Usuario.findOne({ email })
    if (existeEmail && existeEmail._id.toString() !== id) return res.status(400).json({ message: 'El email ya existe' })

    // Validar nombre
    const existeNombre = await Usuario.findOne({ nombre })
    if (existeNombre && existeNombre._id.toString() !== id) return res.status(400).json({ message: 'El nombre ya existe' })

    // Id valido
    if (!isValidId(id)) return res.status(400).json({ message: 'ID usuario no valido' })

    // Existe el usuario
    if (!usuario) return res.status(400).json({ message: 'El usuario no existe' })

    // Si existe avatar
    if (usuario.avatar.public_id) {
      // Eliminar imagen de cloudinary
      await deleteFile({ public_id: usuario.avatar.public_id, folder: 'clon-twitter/avatars' })
    }
    // Si existe banner
    if (usuario.banner.public_id) {
      // Eliminar imagen de cloudinary
      await deleteFile({ public_id: usuario.banner.public_id, folder: 'clon-twitter/banners' })
    }

    // Subir avatar
    if (req?.files?.avatar) {
      const avatar = await writeImagen(req.files.avatar, 'clon-twitter/avatars')
      usuario.avatar = avatar
    }

    // Subir banner
    if (req?.files?.banner) {
      const banner = await writeImagen(req.files.banner, 'clon-twitter/banners')
      usuario.banner = banner
    }

    // Actualizar
    usuario.nombre = nombre
    usuario.usuario = usuarioArroba
    usuario.descripcion = descripcion
    usuario.nacimiento = nacimiento

    if (usuario.email !== email) {
      usuario.email = email
    }

    const usuarioGuardado = await usuario.save()

    const respuesta = {
      usuario: {
        _id: usuarioGuardado._id,
        nombre: usuarioGuardado.nombre,
        descripcion: usuarioGuardado.descripcion,
        usuario: usuarioGuardado.usuario,
        nacimiento: usuarioGuardado.nacimiento,
        email: usuarioGuardado.email,
        avatar: usuarioGuardado.avatar,
        banner: usuarioGuardado.banner,
        seguidores: usuarioGuardado.seguidores,
        seguidos: usuarioGuardado.seguidos,
        guardados: usuarioGuardado.guardados,
        historias: usuarioGuardado.historias,
        createdAt: usuarioGuardado.createdAt
      }
    }

    res.json({ message: 'Usuario Actualizado', ...respuesta })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// SEGUIDORES
export const seguidores = async (req, res) => {
  try {
    const { usuario } = req
    const { id } = req.params

    // No se pude seguir a si mismo
    if (usuario._id.toString() === id) return res.status(400).json({ message: 'usuarios iguales' })

    // Id valido
    if (!isValidId(id)) return res.status(400).json({ message: 'ID usuario no valido' })

    // Obtener el usuario del perfil que se visita
    const usuarioPerfil = await Usuario.findById(id).select('-password -expiraTokenPassword -tokenConfirmacion -tokenPassword -email -confirmado -guardados')

    // Existe el usuario en su array de suguidores
    const existe = usuarioPerfil.seguidores.includes(usuario._id.toString())

    // Existe el usuario
    if (!usuarioPerfil) return res.status(400).json({ message: 'El usuario no existe' })

    // Agregar o Quitar al seguidores
    if (existe) {
      usuarioPerfil.seguidores.pull(usuario._id)
      usuario.seguidos.pull(id)
    } else {
      //  El usuario esta en el array de bloqueadosPor[]
      if (usuario.bloqueadoPor.includes(usuarioPerfil._id.toString())) return res.status(403).json({ message: 'El usuario te mantiene bloqueado' })
      // El usuario esta en el array de bloqueadosPor[]
      if (usuarioPerfil.bloqueadoPor.includes(usuario._id.toString())) return res.status(403).json({ message: `Mantienes bloqueado a ${usuarioPerfil.nombre}` })

      usuarioPerfil.seguidores.push(usuario._id)
      usuario.seguidos.push(id)
    }

    // CREAMOS LA NOTIFICACION
    const notificacion = await crearNotificacion({
      receptor: id,
      texto: `${usuario.usuario} ${existe ? 'A dejado de seguirte :( ❤' : 'A comenzado a seguirte ❤'} `
    })

    // GUARDAMOS
    const [perfiGuardado, usuarioGuardado] = await Promise.all([usuarioPerfil.save(), usuario.save()])

    res.json({ message: existe ? `Quito el seguimiento de ${usuarioPerfil.nombre.split(' ')[0]}` : `Has comenzado a seguir a ${usuarioPerfil.nombre.split(' ')[0]}`, usuario: usuarioGuardado, persona: perfiGuardado, notificacion })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// GUARDAR
export const guardar = async (req, res) => {
  try {
    const { tweetId } = req.params
    const { usuario } = req

    if (!isValidId(tweetId)) return res.status(400).json({ message: 'ID tweet no valido' })

    // Obtener el tweet
    const tweet = await Tweet.findById(tweetId)

    // Existe el tweet
    if (!tweet) return res.status(400).json({ message: 'El tweet no existe' })

    const existe = usuario.guardados.some((t) => t._id.toString() === tweetId)

    // Agregar o Quitar al guardados
    if (existe) {
      usuario.guardados.pull(tweet._id)
    } else {
      usuario.guardados.push(tweet._id)
    }

    // Guardar
    const usuarioGuardado = await await usuario.save()

    res.json({ message: existe ? 'Removido' : 'Guardado', usuario: usuarioGuardado })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// OBTENER TWEETS GUARDADOS
export const obtenerTweetsGuardados = async (req, res) => {
  try {
    const { usuario } = req

    const limit = parseInt(req.query.limit) || 10

    // Obtener tweets guardados del usuario
    const tweetsGuardados = await usuario.populate({
      path: 'guardados',
      populate: [
        { path: 'creador', select: '-password -expiraTokenPassword -tokenConfirmacion -tokenPassword -email -nacimiento -seguidores -seguidos -descripcion -confirmado -banner -guardados' },
        { path: 'hearts', select: '-password -expiraTokenPassword -tokenConfirmacion -tokenPassword -email -nacimiento -seguidores -seguidos -descripcion -confirmado -banner -guardados' },
        { path: 'menciones', select: '-password -expiraTokenPassword -tokenConfirmacion -tokenPassword -email -nacimiento -seguidores -seguidos -descripcion -confirmado -banner -guardados' },
        { path: 'retweet.usuarioId', select: '-password -expiraTokenPassword -tokenConfirmacion -tokenPassword -email -nacimiento -seguidores -seguidos -descripcion -confirmado -banner -guardados' },
        {
          path: 'retweet.tweetId',
          select: 'descripcion foto creador menciones createdAt',
          populate: [
            {
              path: 'creador',
              select: '-password -expiraTokenPassword -tokenConfirmacion -tokenPassword -email -nacimiento -seguidores -seguidos -descripcion -confirmado -banner -guardados'
            },
            {
              path: 'menciones',
              select: '-password -expiraTokenPassword -tokenConfirmacion -tokenPassword -email -nacimiento -seguidores -seguidos -descripcion -confirmado -banner -guardados'
            }
          ]
        }
      ],
      limit
    })

    // Enviar respuesta
    res.json(tweetsGuardados.guardados)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}
