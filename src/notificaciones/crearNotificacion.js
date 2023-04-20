import Notificacion from '../models/Notificacion.js'

const crearNotificacion = async ({ receptor, texto }) => {
  // CREAMOS LA NOTIFACION
  const notificacion = new Notificacion({
    usuario: receptor,
    texto
  })

  // GUARDAR NOTIFIACION
  return await notificacion.save()
}

export default crearNotificacion
