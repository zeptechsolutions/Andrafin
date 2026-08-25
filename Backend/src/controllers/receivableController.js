const Receivable = require('../models/Receivable');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const asyncHandler = require('../utils/asyncHandler');

const refreshStatus = (item) => {
  if (item.outstandingAmount <= 0) item.status = 'paid';
  else if (item.expectedDate && new Date(item.expectedDate) < new Date()) item.status = 'overdue';
  else if (item.outstandingAmount < item.originalAmount) item.status = 'partial';
  else item.status = 'pending';
};

const list = asyncHandler(async (req, res) => {
  const items = await Receivable.find({ user: req.user._id })
    .populate('payments.account', 'name type')
    .sort({ status: 1, expectedDate: 1, createdAt: -1 });

  for (const item of items) {
    const before = item.status;
    refreshStatus(item);
    if (item.status !== before) await item.save();
  }

  res.json({ success: true, receivables: items });
});

const create = asyncHandler(async (req, res) => {
  const { payer, concept, originalAmount, expectedDate, notes } = req.body;
  if (!payer || !concept || !originalAmount) {
    res.status(400);
    throw new Error('Persona, concepto y monto son obligatorios');
  }

  const amount = Number(originalAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400);
    throw new Error('El monto debe ser mayor que cero');
  }

  const item = await Receivable.create({
    user: req.user._id,
    payer,
    concept,
    originalAmount: amount,
    outstandingAmount: amount,
    expectedDate: expectedDate || undefined,
    notes
  });

  refreshStatus(item);
  await item.save();

  res.status(201).json({ success: true, receivable: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await Receivable.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) {
    res.status(404);
    throw new Error('Cuenta por cobrar no encontrada');
  }

  ['payer', 'concept', 'expectedDate', 'notes'].forEach((key) => {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  });

  refreshStatus(item);
  await item.save();
  res.json({ success: true, receivable: item });
});

const receivePayment = asyncHandler(async (req, res) => {
  const { amount, account, date } = req.body;

  if (!amount || !account) {
    res.status(400);
    throw new Error('Monto y cuenta son obligatorios');
  }

  const validAccount = await Account.exists({ _id: account, user: req.user._id, isActive: true });
  if (!validAccount) {
    res.status(400);
    throw new Error('Cuenta inválida');
  }

  const item = await Receivable.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) {
    res.status(404);
    throw new Error('Cuenta por cobrar no encontrada');
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    res.status(400);
    throw new Error('El monto debe ser mayor que cero');
  }

  if (numericAmount > item.outstandingAmount) {
    res.status(400);
    throw new Error('El cobro supera el saldo pendiente');
  }

  const paymentDate = date || new Date();

  const tx = await Transaction.create({
    user: req.user._id,
    type: 'receivable_payment',
    amount: numericAmount,
    account,
    concept: `Cobro recibido: ${item.concept}`,
    date: paymentDate,
    sourceModel: 'Receivable',
    sourceId: item._id
  });

  item.outstandingAmount -= numericAmount;
  item.payments.push({
    amount: numericAmount,
    account,
    date: paymentDate,
    transaction: tx._id
  });

  refreshStatus(item);
  await item.save();

  res.json({ success: true, receivable: item, transaction: tx });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Receivable.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) {
    res.status(404);
    throw new Error('Cuenta por cobrar no encontrada');
  }

  if (item.payments.length) {
    res.status(400);
    throw new Error('No puedes eliminar una cuenta por cobrar con cobros registrados');
  }

  await item.deleteOne();
  res.json({ success: true, message: 'Cuenta por cobrar eliminada' });
});

module.exports = { list, create, update, receivePayment, remove };
