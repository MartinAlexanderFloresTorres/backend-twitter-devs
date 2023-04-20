import cron from 'node-cron'
import Historia from '../models/Historia.js'
import deleteFile from '../cloudinary/deleteFile.js'
import deleteVideo from '../cloudinary/deleteVideo.js'

// Función para eliminar una historia y su archivo de Cloudinary (si existe)
async function eliminarHistoria(id) {
  const historia = await Historia.findById(id)
  if (historia) {
    // Eliminamos el archivo de Cloudinary si existe
    if (historia.archivo.data?.public_id) {
      if (historia.archivo.tipo === 'video') {
        await deleteVideo({ public_id: historia.archivo.data.public_id, folder: 'clon-twitter/archivos-estados' })
      } else {
        await deleteFile({ public_id: historia.archivo.data.public_id, folder: 'clon-twitter/archivos-estados' })
      }
    }
    // Eliminamos la historia de la base de datos
    await Historia.deleteOne({ _id: historia._id })
  }
}

// Programamos la tarea para que se ejecute cada una hora cada día
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Ejecutando tarea de eliminar estados')
    const expiracion = new Date()
    const historiasExpiradas = await Historia.find({ fechaExpiracion: { $lt: expiracion } })
    if (historiasExpiradas.length > 0) {
      console.log(`Eliminando ${historiasExpiradas.length} historias expiradas`)
      for (const historia of historiasExpiradas) {
        await eliminarHistoria(historia._id)
      }
    }
  } catch (error) {
    console.log(error)
  }
})
