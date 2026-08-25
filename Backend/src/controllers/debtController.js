const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');

const refreshStatus = (debt) => {
  if (debt.outstandingAmount <= 0) debt.status='paid';
  else if (debt.dueDate && new Date(debt.dueDate) < new Date()) debt.status='overdue';
  else if (debt.outstandingAmount < debt.originalAmount) debt.status='partial';
  else debt.status='pending';
};
const list=asyncHandler(async(req,res)=>res.json({success:true,debts:await Debt.find({user:req.user._id}).sort({dueDate:1,createdAt:-1})}));
const create=asyncHandler(async(req,res)=>{
  const {creditor,concept,originalAmount,startDate,dueDate,notes}=req.body;
  if(!creditor||!concept||!originalAmount){res.status(400);throw new Error('Acreedor, concepto y monto son obligatorios');}
  const debt=await Debt.create({user:req.user._id,creditor,concept,originalAmount,outstandingAmount:originalAmount,startDate,dueDate,notes});
  res.status(201).json({success:true,debt});
});
const update=asyncHandler(async(req,res)=>{
  const debt=await Debt.findOne({_id:req.params.id,user:req.user._id}); if(!debt){res.status(404);throw new Error('Deuda no encontrada');}
  ['creditor','concept','dueDate','notes','startDate'].forEach(k=>{if(req.body[k]!==undefined) debt[k]=req.body[k];});
  refreshStatus(debt); await debt.save(); res.json({success:true,debt});
});
const pay=asyncHandler(async(req,res)=>{
  const {amount,account,date}=req.body; if(!amount||!account){res.status(400);throw new Error('Monto y cuenta son obligatorios');}
  const debt=await Debt.findOne({_id:req.params.id,user:req.user._id}); if(!debt){res.status(404);throw new Error('Deuda no encontrada');}
  if(Number(amount)>debt.outstandingAmount){res.status(400);throw new Error('El pago supera el saldo pendiente');}
  const tx=await Transaction.create({user:req.user._id,type:'debt_payment',amount,account,concept:`Pago de deuda: ${debt.concept}`,date:date||new Date(),sourceModel:'Debt',sourceId:debt._id});
  debt.outstandingAmount-=Number(amount); debt.payments.push({amount,account,date:date||new Date(),transaction:tx._id}); refreshStatus(debt); await debt.save();
  res.json({success:true,debt,transaction:tx});
});
const remove=asyncHandler(async(req,res)=>{
  const debt=await Debt.findOne({_id:req.params.id,user:req.user._id}); if(!debt){res.status(404);throw new Error('Deuda no encontrada');}
  if(debt.payments.length){res.status(400);throw new Error('No puedes eliminar una deuda con pagos registrados');}
  await debt.deleteOne(); res.json({success:true,message:'Deuda eliminada'});
});
module.exports={list,create,update,pay,remove};
