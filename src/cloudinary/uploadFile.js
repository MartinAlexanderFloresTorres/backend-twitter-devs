import { v2 as cloudinary } from 'cloudinary'

const uploadFile = async ({ path, folder }) => {
  return await cloudinary.uploader
    .upload(path, {
      folder
    })
    .catch((error) => {
      console.log(error)
    })
}

export default uploadFile
