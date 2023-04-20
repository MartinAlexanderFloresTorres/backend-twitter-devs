import jwt from 'jsonwebtoken'
import Usuario from '../models/Usuario.js'

const checkAuth = async (req, res, next) => {
  const { authorization } = req.headers
  let token = null
  // si hay un token en el header
  if (authorization && authorization?.startsWith('Bearer')) {
    try {
      token = authorization.split(' ')[1]
      const decored = jwt.verify(token, process.env.JWT_SECRET)
      req.usuario = await Usuario.findById(decored?.id)
        .select('-password -token -confirmado -tokenConfirmacion -tokenPassword -expiraTokenPassword -updatedAt -__v')
        .populate('seguidores', '-password -token -confirmado -tokenConfirmacion -tokenPassword -seguidos -seguidores -guardados -nacimiento -email -descripcion -createdAt -banner -expiraTokenPassword -updatedAt -__v')
        .populate('seguidos', '-password -token -confirmado -tokenConfirmacion -tokenPassword -seguidos -seguidores -guardados -nacimiento -email -descripcion -createdAt -banner -expiraTokenPassword -updatedAt -__v')
      return next()
    } catch (e) {
      const error = new Error('Token no válido')
      return res.status(403).json({ message: error.message })
    }
  }

  if (!token) {
    const error = new Error('Token requerido')
    return res.status(403).json({ message: error.message })
  }

  next()
}

export default checkAuth
