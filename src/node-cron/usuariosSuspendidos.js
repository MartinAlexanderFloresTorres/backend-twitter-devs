import cron from 'node-cron'
import Usuario from '../models/Usuario.js'

// Programar tarea para que se ejecute diariamente a las 00:00
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Ejecutando tarea de usuarios suspendidos')
    // Obtener la lista de usuarios suspendidos
    const usuariosSuspendidos = await Usuario.find({ suspendido: true }).select('suspendido usuario expiracionSuspendido')

    // Verificar si ha pasado la fecha de expiración de la suspensión
    const fechaActual = new Date()
    usuariosSuspendidos.forEach(async (usuario) => {
      if (usuario.expiracionSuspendido <= fechaActual) {
        // Actualizar el estado de suspensión del usuario
        usuario.suspendido = false
        usuario.expiracionSuspendido = null
        await usuario.save()
        console.log(`${usuario.usuario} a sido removido de suspendido`)
      }
    })
  } catch (error) {
    console.log(error)
  }
})
