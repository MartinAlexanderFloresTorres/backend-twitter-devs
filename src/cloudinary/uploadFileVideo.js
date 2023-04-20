import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

const uploadFileVideo = async ({ path, folder }) => {
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: 'video', folder }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })

    const fileReader = fs.createReadStream(path)
    fileReader.pipe(stream)
  })
}

export default uploadFileVideo
