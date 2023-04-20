import { Router } from 'express'
import fileupload from 'express-fileupload'
import checkAuth from '../middlewares/checkAuth.js'
import { crear, eliminarHistoria, heart, obtenerHistoria, obtenerHistoriasSeguidores, obtenerHistoriasUsuario, vistoHistoria } from '../controllers/historiaController.js'

// RUTA: /api/historia
const historiaRouter = Router()

// POST -> CREAR
historiaRouter.post('/', checkAuth, fileupload({ useTempFiles: false }), crear)

// GET -> OBTENER HISTORIA
historiaRouter.get('/:historiaId', checkAuth, obtenerHistoria)

// GET -> OBTENER HISTORIAS DE LOS SEGUIDORES DEL USUARIO
historiaRouter.get('/seguidores/obtener', checkAuth, obtenerHistoriasSeguidores)

// GET -> OBTENER HISTORIAS DEl USUARIO
historiaRouter.get('/:usuarioId/obtener', checkAuth, obtenerHistoriasUsuario)

// POST -> HEART HISTORIA ID
historiaRouter.post('/heart/:historiaId', checkAuth, heart)

// DELETE -> OBTENER HISTORIAS DE LOS SEGUIDORES DEL USUARIO
historiaRouter.delete('/:id', checkAuth, eliminarHistoria)

// GET -> MARCAR VISTO HISTORIA ID
historiaRouter.get('/visto/:id', checkAuth, vistoHistoria)

export default historiaRouter
