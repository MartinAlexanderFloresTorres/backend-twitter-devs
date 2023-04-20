import { v2 as cloudinary } from 'cloudinary'

const deleteFile = async ({ public_id, folder }) => {
  return await cloudinary.uploader
    .destroy(public_id, {
      folder
    })
    .catch((error) => {
      console.log(error)
    })
}

export default deleteFile
