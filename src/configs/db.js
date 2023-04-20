import mongoose from 'mongoose'

const db = async () => {
  try {
    const data = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log(`MongoDB conectado: ${data.connection.host}`)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

export default db
