import mongoose from 'mongoose'

const mensajeSchema = new mongoose.Schema(
  {
    conversacionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversacion',
      require: true
    },
    emisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      require: true
    },
    receptor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      require: true
    },
    mensaje: {
      type: String,
      require: true
    },
    foto: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true
  }
)

const Mensaje = mongoose.model('Mensaje', mensajeSchema)

export default Mensaje
