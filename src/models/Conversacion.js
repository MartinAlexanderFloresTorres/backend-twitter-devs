import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const ConversacionSchema = new mongoose.Schema(
  {
    miembros: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        require: true
      }
    ],
    ultimoMensaje: {
      usuarioId: {
        type: String,
        default: ''
      },
      texto: {
        type: String,
        default: ''
      },
      isfoto: {
        type: Boolean,
        default: false
      }
    },
    archivadoPor: [
      {
        type: String,
        default: ''
      }
    ],
    eliminadoPor: [
      {
        type: String,
        default: ''
      }
    ],
    bloqueado: {
      type: Boolean,
      default: false
    },
    bloqueadoPor: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)
// PAGINACION
ConversacionSchema.plugin(mongoosePaginate)

const Conversacion = mongoose.model('Conversacion', ConversacionSchema)

export default Conversacion
