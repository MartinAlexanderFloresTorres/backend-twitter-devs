import { Router } from 'express'
import fileupload from 'express-fileupload'
import checkAuth from '../middlewares/checkAuth.js'
import { crear, confirmar, login, recuperar, verificarToken, cambiarPassword, obtenerUsuario, obtenerUsuarioHash, actualizar, seguidores, guardar, obtenerTweetsGuardados, buscarUsuarios } from '../controllers/usuarioController.js'

// RUTA: /api/usuarios
const usuarioRouter = Router()

// POST -> CREAR
usuarioRouter.post('/', crear)

// POST -> CONFIRMAR
usuarioRouter.post('/confirmar/:token', confirmar)

// POST -> LOGIN
usuarioRouter.post('/login', login)

// POST -> RECUPERAR CONTRASEÑA
usuarioRouter.post('/recuperar', recuperar)

// GET -> VERIFICAR TOKEN
usuarioRouter.get('/recuperar/:token', verificarToken)

// GET -> BUSCAR USUARIOS
usuarioRouter.get('/buscar', checkAuth, buscarUsuarios)

// POST -> NUEVO PASSWORD
usuarioRouter.post('/recuperar/:token', cambiarPassword)

// GET -> OBTENER USUARIO
usuarioRouter.get('/', checkAuth, obtenerUsuario)

// GET -> OBTENER USUARIO HASH
usuarioRouter.get('/:usuario', obtenerUsuarioHash)

// PUT -> ACTUALIZAR USUARIO
usuarioRouter.put('/:id', checkAuth, fileupload({ useTempFiles: false }), actualizar)

// POST -> SEGUIDORES
usuarioRouter.post('/seguidores/:id', checkAuth, seguidores)

// POST ->  GUARDAR BY ID
usuarioRouter.post('/guardar/:tweetId', checkAuth, guardar)

// GET ->  OBTENER BY ID
usuarioRouter.get('/guardados/:id', checkAuth, obtenerTweetsGuardados)

export default usuarioRouter
