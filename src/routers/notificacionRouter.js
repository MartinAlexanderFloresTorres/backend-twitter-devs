import { Router } from 'express'
import checkAuth from '../middlewares/checkAuth.js'
import { eliminar, eliminarTodas, estado, marcarVistosTodas, obtener } from '../controllers/notificacionController.js'

// RUTA: /api/notificacion
const notificacionRouter = Router()

// GET -> OBTENER
notificacionRouter.get('/', checkAuth, obtener)

// GET -> VISTO
notificacionRouter.get('/estado/:notificacionId', checkAuth, estado)

// GET -> VISTO TODAS
notificacionRouter.get('/vistos/todas', checkAuth, marcarVistosTodas)

// GET -> NOTIFICACIONES
notificacionRouter.delete('/eliminar/todas', checkAuth, eliminarTodas)

// DELETE -> NOTIFICACION
notificacionRouter.delete('/:notificacionId', checkAuth, eliminar)

// DELETE -> NOTIFICACIONES
notificacionRouter.delete('/eliminar/todas', checkAuth, eliminarTodas)

export default notificacionRouter
