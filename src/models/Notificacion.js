import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const notificacionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    texto: {
      type: String,
      required: true
    },
    visto: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)
// PAGINACION
notificacionSchema.plugin(mongoosePaginate)

const Notificacion = mongoose.model('Notificacion', notificacionSchema)

export default Notificacion
