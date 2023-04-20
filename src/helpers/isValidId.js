import mongoose from 'mongoose'

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

export default isValidId
