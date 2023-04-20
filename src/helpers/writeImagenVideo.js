import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import shortid from 'shortid'
import uploadFile from '../cloudinary/uploadFile.js'
import ValidarImagenesVideos from './ValidarImagenesVideos.js'
import uploadFileVideo from '../cloudinary/uploadFileVideo.js'
import { spawnSync } from 'child_process'

const writeImagenVideo = async (file, tipo, folder) => {
  // Obtener extencion
  const extencion = file.name.split('.').pop()

  // Validar extencion
  if (!ValidarImagenesVideos({ tipo: file.mimetype })) {
    throw new Error('La extención no es válida')
  }

  // Ruta de la carpeta que quieres crear si no existe
  const folderPath = './public/uploads'

  // Comprobar si la carpeta existe
  if (!existsSync(folderPath)) {
    // Crear la carpeta si no existe
    mkdirSync(folderPath)
  }

  // Generar nombre con la ruta
  let path = `./public/uploads/${shortid.generate()}.${extencion}`

  let data
  try {
    // Guardar archivo
    writeFileSync(path, file.data)

    if (tipo === 'imagen') {
      //  Subir imagen
      data = await uploadFile({ path, folder })
    } else {
      // Subir video
      // Verificar duración del video
      const duration = parseInt(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path]).stdout.toString())
      if (duration > 60) {
        // Recortar el video a 60 segundos
        const output = `./public/uploads/${shortid.generate()}.${extencion}`
        spawnSync('ffmpeg', ['-i', path, '-t', '60', '-c', 'copy', output])
        path = output
        console.log('recortado')
        /* throw new Error('El video no puede superar los 60 segundos') */
      }
      data = await uploadFileVideo({ path, folder })
    }

    // Extraer datos
    const { public_id, secure_url } = data
    // Guardar el el req.archivo
    const archivo = { public_id, secure_url }
    // Eliminar archivo
    unlinkSync(path)

    return archivo
  } catch (error) {
    throw new Error(error.message)
  }
}

export default writeImagenVideo
