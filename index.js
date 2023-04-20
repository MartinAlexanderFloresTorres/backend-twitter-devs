import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import db from './src/configs/db.js'
import usuarioRouter from './src/routers/usuarioRouter.js'
import tweetRouter from './src/routers/tweetRouter.js'
import mensajeRouter from './src/routers/mensajeRouter.js'
import notificacionRouter from './src/routers/notificacionRouter.js'
import historiaRouter from './src/routers/historiaRouter.js'
import comentarioRouter from './src/routers/comentarioRouter.js'
import './src/node-cron/eliminarHistoria.js'
import './src/node-cron/usuariosSuspendidos.js'

const app = express()

//Config
app.use(express.json())
dotenv.config()
app.use(cors({ origin: process.env.FRONTEND_URL }))

// DB
db()

// Puerto
const PORT = process.env.PORT || 4000

// listen
const servidor = app.listen(PORT, () => {
  console.log(`RUN ${PORT}`)
})

const io = new Server(servidor, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_URL
  }
})

// Configurar cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true
})

// Rutas
app.use('/api/usuarios', usuarioRouter)
app.use('/api/tweet', tweetRouter)
app.use('/api/comentario', comentarioRouter)
app.use('/api/mensaje', mensajeRouter)
app.use('/api/notificacion', notificacionRouter)
app.use('/api/historia', historiaRouter)

let usuariosConectados = []

io.on('connection', function (socket) {
  // EMITIR LOS USUARIOS CONECTADOS
  io.emit('/estados/usuarios/conectados', usuariosConectados)

  //=============== ESTADOS DE LOS USUARIOS ===============//
  socket.on('/estados/usuarios/conectar', (usuarioId) => {
    const existeUsuario = usuariosConectados.find((u) => u.usuarioId === usuarioId)
    if (!existeUsuario) usuariosConectados.push({ id: socket.id, usuarioId })

    // EMITIR LOS USUARIOS CONECTADOS
    io.emit('/estados/usuarios/conectados', usuariosConectados)
  })

  //=============== mensajes ===============//
  // RECIBIMOS EL EVENTO DE ABRIR CONVERSACION
  socket.on('/abrir/conversacion/id', (conversacionId) => {
    socket.join(conversacionId)
  })

  // RECIBIMOS EL EVENTO DE MENSAJE
  socket.on('/mensaje/conversacion/emitir', (data) => {
    const conversacionId = data.conversacion._id
    const receptorId = data.mensaje.receptor._id
    const emisorId = data.mensaje.emisor._id

    // EMITIMOS EL EVENTO DE MENSAJE
    io.to(conversacionId).emit('/mensaje/conversacion/obtener', data.mensaje)

    //  EMITIMOS EL EVENTO DE MENSAJE PREVIO
    io.to([receptorId, emisorId]).emit('/usuario/conversaciones/obtener', data.conversacion)
  })

  // RECIBIMOS EL EVENTO DE BLOQUEO
  socket.on('/bloqueo/conversacion/emitir', (data) => {
    const conversacionId = data._id
    const miembros = data.miembros.map((m) => m._id)

    // EMITIMOS EL EVENTO DE BLOQUEO
    io.to(conversacionId).emit('/bloqueo/conversacion/obtener', data)

    //  EMITIMOS EL EVENTO DE MENSAJE PREVIO
    io.to(miembros).emit('/usuario/conversaciones/obtener', data)
  })

  // RECIBIMOS EL EVENTO DE ELIMINAR
  socket.on('/eliminar/conversacion/emitir', (data) => {
    const conversacionId = data.conversacion._id
    const miembros = data.conversacion.miembros.map((m) => m._id)

    // EMITIMOS EL EVENTO DE ELIMINAR
    io.to(conversacionId).emit('/eliminar/conversacion/obtener', data.mensajes)

    // EMITIMOS EL EVENTO DE MENSAJE PREVIO
    io.to(miembros).emit('/usuario/conversaciones/obtener', data.conversacion)
  })

  // Manejar el evento "leave" para salir de la sala del usuario
  socket.on('/mensaje/salir/conversacion/id', (conversacionId) => {
    socket.leave(conversacionId)
  })

  //=============== conversaciones ===============//
  // RECIBIMOS EL EVENTO DE ABRIR LA CONVERSACION
  socket.on('/abrir/conversaciones/usuario', (usuarioId) => {
    socket.join(usuarioId)
  })

  // Manejar el evento "leave" para salir de la sala del usuario
  socket.on('/usuario/salir/conversaciones/id', (usuarioId) => {
    socket.leave(usuarioId)
  })

  //=============== notificaciones ===============//
  // RECIBIMOS EL EVENTO DE ABRIR LA NOTIFICACION
  socket.on('/abrir/notificaciones/usuario', (usuarioId) => {
    socket.join(usuarioId)
  })

  // RECIBIMOS EL EVENTO DE NOTIFICACION
  socket.on('/usuario/notificaciones/emitir', (data) => {
    const usuarioId = data.usuario

    // EMITIMOS EL EVENTO DE NOTIFICACION
    io.to(usuarioId).emit('/usuario/notificaciones/obtener', data)
  })

  // Manejar el evento "leave" para salir de la sala del usuario
  socket.on('/usuario/salir/notificaciones/id', (usuarioId) => {
    socket.leave(usuarioId)
  })

  // DESCONECTAR AL USUARIO
  socket.on('disconnect', () => {
    // QUITAR AL USUARIO DEL ARRAY DE CONECTADOS
    usuariosConectados = usuariosConectados.filter((u) => u.id !== socket.id)
    // EMITIR LOS USUARIOS CONECTADOS
    io.emit('/estados/usuarios/conectados', usuariosConectados)
  })
})
