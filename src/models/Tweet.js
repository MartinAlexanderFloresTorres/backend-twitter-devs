import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const tweetSchema = new mongoose.Schema(
  {
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    descripcion: {
      type: String,
      required: true
    },
    foto: {
      type: Object,
      default: null
    },
    retweet: {
      usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      tweetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
      }
    },
    hashtags: [
      {
        type: String,
        default: []
      }
    ],
    menciones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: []
      }
    ],
    hearts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: []
      }
    ],
    comentarios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comentario',
        default: []
      }
    ]
  },
  {
    timestamps: true
  }
)

// PAGINACION
tweetSchema.plugin(mongoosePaginate)

const Tweet = mongoose.model('Tweet', tweetSchema)

export default Tweet
