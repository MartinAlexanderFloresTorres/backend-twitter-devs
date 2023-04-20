import { Router } from 'express'
import fileupload from 'express-fileupload'
import checkAuth from '../middlewares/checkAuth.js'
import { archivar, bloquear, crear, eliminar, obtenerByTo, obtenerConversacion, obtenerPrevios, obtenerPreviosArchivados } from '../controllers/mensajeController.js'

// RUTA: /api/mensaje
const mensajeRouter = Router()

// POST -> CREAR
mensajeRouter.post('/:receptor', checkAuth, fileupload({ useTempFiles: false }), crear)

// GET -> OBTENER MENSAJES PREVIOS EMISOR
mensajeRouter.get('/previos', checkAuth, obtenerPrevios)

// GET -> OBTENER CONVERSACION
mensajeRouter.get('/conversacion/:receptor', checkAuth, obtenerConversacion)

// GET -> OBTENER MENSAJES TO
mensajeRouter.get('/chat/:conversacionId/:receptor', checkAuth, obtenerByTo)

// DELETE -> ELIMINAR MENSAJES
mensajeRouter.delete('/chat/:conversacionId/:receptor', checkAuth, eliminar)

// GET -> ARCHIVAR MENSAJES
mensajeRouter.get('/chat/archivar/:conversacionId/:receptor', checkAuth, archivar)

// GET -> BLOQUEAR MENSAJES
mensajeRouter.get('/chat/bloquear/:conversacionId/:receptor', checkAuth, bloquear)

// GET -> ARCHIVADOS MENSAJES
mensajeRouter.get('/archivados/previos', checkAuth, obtenerPreviosArchivados)

export default mensajeRouter
