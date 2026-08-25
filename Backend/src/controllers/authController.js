const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../services/emailService');

const safeUser = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  currency: 'USD',
  notifications: user.notifications
});

const emailShell = (title, body) => `
<!doctype html><html><body style="margin:0;background:#f4f1e8;font-family:Arial,sans-serif;color:#17362d">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden">
<tr><td style="background:#17362d;padding:26px 30px;color:#d4af37"><div style="font-size:24px;font-weight:700">AndraFin</div><div style="font-size:12px;letter-spacing:2px;margin-top:5px">FINANZAS PERSONALES</div></td></tr>
<tr><td style="padding:30px"><h2 style="margin:0 0 16px;color:#17362d">${title}</h2>${body}
<p style="margin:28px 0 0;color:#7a817d;font-size:12px">Este correo fue enviado automáticamente por AndraFin.</p></td></tr>
</table></td></tr></table></body></html>`;

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400); throw new Error('Nombre, correo y contraseña son obligatorios');
  }
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    res.status(409); throw new Error('El correo ya está registrado');
  }
  const user = await User.create({ name, email, password, currency: 'USD' });

  // El registro no falla si Gmail tiene un problema temporal.
  sendEmail({
    to: user.email,
    subject: 'Bienvenido a AndraFin',
    html: emailShell(
      `¡Bienvenido, ${user.name}!`,
      `<p style="line-height:1.65">Tu cuenta de AndraFin fue creada correctamente.</p>
       <p style="line-height:1.65">Ya puedes registrar ingresos, gastos, cuentas, deudas, préstamos, presupuestos y metas desde un solo lugar.</p>`
    )
  }).catch(err => console.error('No se pudo enviar el correo de bienvenida:', err.message));

  res.status(201).json({ success: true, token: generateToken(user._id), user: safeUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) {
    res.status(401); throw new Error('Correo o contraseña incorrectos');
  }
  res.json({ success: true, token: generateToken(user._id), user: safeUser(user) });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetExpires');

  // Respuesta neutra para no revelar si una cuenta existe.
  if (!user) return res.json({ success: true, message: 'Si el correo está registrado, recibirás un código de recuperación.' });

  const code = String(crypto.randomInt(100000, 1000000));
  user.passwordResetCodeHash = crypto.createHash('sha256').update(code).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Recupera tu contraseña de AndraFin',
    html: emailShell(
      'Recuperación de contraseña',
      `<p style="line-height:1.65">Recibimos una solicitud para cambiar tu contraseña.</p>
       <p style="line-height:1.65">Tu código de verificación es:</p>
       <div style="font-size:32px;font-weight:700;letter-spacing:7px;color:#b18a20;background:#f7f4ea;border-radius:14px;padding:18px;text-align:center">${code}</div>
       <p style="line-height:1.65">El código vence en 15 minutos. Si no solicitaste el cambio, puedes ignorar este correo.</p>`
    )
  });

  res.json({ success: true, message: 'Si el correo está registrado, recibirás un código de recuperación.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  const code = String(req.body.code || '').trim();
  const newPassword = String(req.body.newPassword || '');
  if (!email || !code || newPassword.length < 6) {
    res.status(400); throw new Error('Correo, código y una contraseña de al menos 6 caracteres son obligatorios');
  }

  const user = await User.findOne({ email }).select('+password +passwordResetCodeHash +passwordResetExpires');
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  if (!user || !user.passwordResetCodeHash || user.passwordResetCodeHash !== hash ||
      !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    res.status(400); throw new Error('El código es inválido o ya venció');
  }

  user.password = newPassword;
  user.passwordResetCodeHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Contraseña actualizada correctamente' });
});

const me = asyncHandler(async (req, res) => res.json({ success: true, user: { ...req.user.toObject(), currency: 'USD' } }));

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { name, email, notifications, currentPassword, newPassword } = req.body;
  if (email && email.toLowerCase().trim() !== user.email) {
    if (await User.exists({ email: email.toLowerCase().trim(), _id: { $ne: user._id } })) {
      res.status(409); throw new Error('Ese correo ya está en uso');
    }
    user.email = email.toLowerCase().trim();
  }
  if (name !== undefined) user.name = name;
  if (notifications !== undefined) user.notifications = { ...user.notifications.toObject(), ...notifications };
  if (newPassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword))) {
      res.status(400); throw new Error('La contraseña actual es incorrecta');
    }
    user.password = newPassword;
  }
  await user.save();
  res.json({ success: true, user: safeUser(user) });
});

module.exports = { register, login, forgotPassword, resetPassword, me, updateProfile };
