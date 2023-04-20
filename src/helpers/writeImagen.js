import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import ValidarImagenes from './ValidarImagenes.js'
import shortid from 'shortid'
import uploadFile from '../cloudinary/uploadFile.js'

const writeImagen = async (file, folder) => {
  // Obtener extencion
  const extencion = file.name.split('.').pop()

  // Validar extencion
  if (!ValidarImagenes({ tipo: file.mimetype })) {
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
  const path = `./public/uploads/${shortid.generate()}.${extencion}`

  // Guardar imagen
  writeFileSync(path, file.data)

  // Subir imagen
  const data = await uploadFile({ path, folder })

  // Extraer datos
  const { public_id, secure_url } = data
  // Guardar el el req.imagen
  const imagen = { public_id, secure_url }
  // Eliminar imagen
  unlinkSync(path)

  return imagen
}

export default writeImagen
