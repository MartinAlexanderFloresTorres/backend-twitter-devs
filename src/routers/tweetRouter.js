import { Router } from 'express'
import fileupload from 'express-fileupload'
import checkAuth from '../middlewares/checkAuth.js'
import { ReTweetcrear, crear, editar, eliminarTweet, hearts, mostrar, mostrarTweetsBusqueda, mostrarTweetsUsuario, obtenerTweet } from '../controllers/tweetController.js'

// RUTA: /api/tweet
const tweetRouter = Router()

// POST -> CREAR
tweetRouter.post('/', checkAuth, fileupload({ useTempFiles: false }), crear)

// POST -> RE TWEET CREAR
tweetRouter.post('/re-tweet/:tweetId', checkAuth, fileupload({ useTempFiles: false }), ReTweetcrear)

// PUT -> EDITAR
tweetRouter.put('/:id', checkAuth, fileupload({ useTempFiles: false }), editar)

// GET -> MOSTRAR
tweetRouter.get('/', mostrar)

// GET -> MOSTRAR TWEET BUSQUEDA
tweetRouter.get('/busqueda/query', mostrarTweetsBusqueda)

// GET -> MOSTRAR TWEETS USUARIO
tweetRouter.get('/user/:creador', mostrarTweetsUsuario)

// GET -> OBTENER TWEET BY ID
tweetRouter.get('/:id', obtenerTweet)

// DELETE ->  TWEET BY ID
tweetRouter.delete('/:id', checkAuth, eliminarTweet)

// POST ->  HEARTS BY ID
tweetRouter.post('/hearts/:id', checkAuth, hearts)

export default tweetRouter
