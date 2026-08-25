const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');

const computeBalances = async (userId, accounts) => {
  const ids = accounts.map(a => a._id);
  const [flows, transfersIn] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, account: { $in: ids }, type: { $ne: 'transfer' } } },
      { $group: { _id: '$account', net: { $sum: { $cond: [{ $in: ['$type', ['income','extra','loan_repayment','receivable_payment']] }, '$amount', { $multiply: ['$amount', -1] }] } } } }
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'transfer', destinationAccount: { $in: ids } } },
      { $group: { _id: '$destinationAccount', total: { $sum: '$amount' } } }
    ])
  ]);
  const transferOut = await Transaction.aggregate([
    { $match: { user: userId, type: 'transfer', account: { $in: ids } } },
    { $group: { _id: '$account', total: { $sum: '$amount' } } }
  ]);
  const map = new Map();
  flows.forEach(x => map.set(String(x._id), x.net));
  const inMap = new Map(transfersIn.map(x => [String(x._id), x.total]));
  const outMap = new Map(transferOut.map(x => [String(x._id), x.total]));
  return accounts.map(a => ({
    ...a.toObject(),
    balance: a.initialBalance + (map.get(String(a._id)) || 0) + (inMap.get(String(a._id)) || 0) - (outMap.get(String(a._id)) || 0)
  }));
};

const list = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 });
  res.json({ success: true, accounts: await computeBalances(req.user._id, accounts) });
});
const create = asyncHandler(async (req, res) => {
  const { name, type, initialBalance } = req.body;
  if (!name) { res.status(400); throw new Error('El nombre de la cuenta es obligatorio'); }
  const account = await Account.create({ user: req.user._id, name, type, initialBalance });
  res.status(201).json({ success: true, account: { ...account.toObject(), balance: account.initialBalance } });
});
const update = asyncHandler(async (req, res) => {
  const account = await Account.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true, runValidators: true });
  if (!account) { res.status(404); throw new Error('Cuenta no encontrada'); }
  const [result] = await computeBalances(req.user._id, [account]);
  res.json({ success: true, account: result });
});
const remove = asyncHandler(async (req, res) => {
  const used = await Transaction.exists({ user: req.user._id, $or: [{ account: req.params.id }, { destinationAccount: req.params.id }] });
  if (used) { res.status(400); throw new Error('No puedes eliminar una cuenta con movimientos; desactívala en su lugar'); }
  const account = await Account.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!account) { res.status(404); throw new Error('Cuenta no encontrada'); }
  res.json({ success: true, message: 'Cuenta eliminada' });
});
module.exports = { list, create, update, remove };
