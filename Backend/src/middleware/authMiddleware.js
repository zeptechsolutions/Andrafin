const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('No autorizado: token requerido');
  }

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Usuario no encontrado');
    }
    req.user = user;
    next();
  } catch (error) {
    if (res.statusCode === 200) res.status(401);
    throw new Error('Token inválido o expirado');
  }
});

module.exports = { protect };
