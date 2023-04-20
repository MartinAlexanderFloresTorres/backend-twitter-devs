import mongoose from 'mongoose'

const HistoriaSchema = new mongoose.Schema(
  {
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      require: true
    },
    archivo: {
      data: {
        type: Object,
        default: null
      },
      tipo: {
        type: String,
        default: ''
      }
    },
    texto: {
      type: String,
      default: ''
    },
    vistosPor: [
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
    fechaExpiracion: {
      type: Date,
      default: new Date(Date.now() + 24 * 60 * 60 * 1000) // fecha actual + 24 horas en milisegundos
    }
  },

  { timestamps: true }
)

const Historia = mongoose.model('Historia', HistoriaSchema)

export default Historia
