import { Router } from 'express'
import fileupload from 'express-fileupload'
import checkAuth from '../middlewares/checkAuth.js'
import { editarComentario, eliminarComentario, nuevoComentario, obtenerComentarios } from '../controllers/comentarioController.js'

// RUTA: /api/comentario
const comentarioRouter = Router()

// GET ->  OBTENER
comentarioRouter.get('/:tweetId', obtenerComentarios)

// POST ->  CREAR
comentarioRouter.post('/:tweetId', checkAuth, fileupload({ useTempFiles: false }), nuevoComentario)

// DELETE ->  COMENTARIO BY ID
comentarioRouter.delete('/:comentarioId/:tweetId', checkAuth, eliminarComentario)

// PUT ->  COMENTARIO BY ID
comentarioRouter.put('/:comentarioId/:tweetId', checkAuth, fileupload({ useTempFiles: false }), editarComentario)

export default comentarioRouter
