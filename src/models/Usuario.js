import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true
    },
    usuario: {
      type: String,
      required: true
    },
    tokenConfirmacion: {
      type: String,
      default: null
    },
    tokenPassword: {
      type: String,
      default: null
    },
    expiraTokenPassword: {
      type: Date,
      default: null
    },
    confirmado: {
      type: Boolean,
      default: false
    },
    nacimiento: {
      type: Date,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    descripcion: {
      type: String,
      default: 'Bienvenido a mi perfil'
    },
    avatar: {
      type: Object,
      default: {
        secure_url: 'https://res.cloudinary.com/drc01haok/image/upload/v1681969805/default-user_pi4ciz.png',
        public_id: null
      }
    },
    banner: {
      type: Object,
      default: {
        secure_url: 'https://res.cloudinary.com/drc01haok/image/upload/v1681970015/1_lflzoz.png',
        public_id: null
      }
    },
    seguidores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      }
    ],
    seguidos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      }
    ],
    guardados: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
      }
    ],
    historias: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Historia'
      }
    ],
    suspendido: {
      type: Boolean,
      default: false
    },
    expiracionSuspendido: {
      type: Date,
      default: null
    },
    bloqueadoPor: [
      {
        type: String,
        default: ''
      }
    ]
  },
  {
    // crea dos columnas de creado y actualizado
    timestamps: true
  }
)

// generar password encriptado
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const salRounds = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salRounds)
})

// comparar password
usuarioSchema.methods.comprobarPassword = async function (passwordUser) {
  return await bcrypt.compare(passwordUser, this.password)
}

const Usuario = mongoose.model('Usuario', usuarioSchema)

export default Usuario
