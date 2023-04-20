import mongoose from 'mongoose'

const comentarioSchema = new mongoose.Schema(
  {
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    tweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet',
      required: true
    },
    texto: {
      type: String,
      required: true
    },
    foto: {
      type: Object,
      default: null
    },
    menciones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: []
      }
    ]
  },
  {
    timestamps: true
  }
)

const Comentario = mongoose.model('Comentario', comentarioSchema)

export default Comentario
