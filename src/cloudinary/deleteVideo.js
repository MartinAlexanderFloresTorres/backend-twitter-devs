import { v2 as cloudinary } from 'cloudinary'

const deleteVideo = async ({ public_id, folder }) => {
  return await cloudinary.uploader
    .destroy(public_id, {
      folder,
      resource_type: 'video'
    })
    .catch((error) => {
      console.log(error)
    })
}

export default deleteVideo
