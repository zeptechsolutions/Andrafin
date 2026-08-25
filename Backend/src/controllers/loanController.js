const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const refreshStatus=(loan)=>{if(loan.outstandingAmount<=0)loan.status='paid';else if(loan.dueDate&&new Date(loan.dueDate)<new Date())loan.status='overdue';else if(loan.outstandingAmount<loan.originalAmount)loan.status='partial';else loan.status='pending';};
const list=asyncHandler(async(req,res)=>res.json({success:true,loans:await Loan.find({user:req.user._id}).sort({dueDate:1,createdAt:-1})}));
const create=asyncHandler(async(req,res)=>{
  const {borrower,concept,originalAmount,startDate,dueDate,notes,account,registerMovement=true}=req.body;
  if(!borrower||!concept||!originalAmount){res.status(400);throw new Error('Persona, concepto y monto son obligatorios');}
  const loan=await Loan.create({user:req.user._id,borrower,concept,originalAmount,outstandingAmount:originalAmount,startDate,dueDate,notes});
  let tx=null;
  if(registerMovement&&account){tx=await Transaction.create({user:req.user._id,type:'loan_given',amount:originalAmount,account,concept:`Préstamo a ${borrower}: ${concept}`,date:startDate||new Date(),sourceModel:'Loan',sourceId:loan._id});}
  res.status(201).json({success:true,loan,transaction:tx});
});
const update=asyncHandler(async(req,res)=>{const loan=await Loan.findOne({_id:req.params.id,user:req.user._id});if(!loan){res.status(404);throw new Error('Préstamo no encontrado');}['borrower','concept','dueDate','notes','startDate'].forEach(k=>{if(req.body[k]!==undefined)loan[k]=req.body[k];});refreshStatus(loan);await loan.save();res.json({success:true,loan});});
const receivePayment=asyncHandler(async(req,res)=>{
  const {amount,account,date}=req.body;if(!amount||!account){res.status(400);throw new Error('Monto y cuenta son obligatorios');}
  const loan=await Loan.findOne({_id:req.params.id,user:req.user._id});if(!loan){res.status(404);throw new Error('Préstamo no encontrado');}
  if(Number(amount)>loan.outstandingAmount){res.status(400);throw new Error('El pago supera el saldo pendiente');}
  const tx=await Transaction.create({user:req.user._id,type:'loan_repayment',amount,account,concept:`Cobro de préstamo: ${loan.concept}`,date:date||new Date(),sourceModel:'Loan',sourceId:loan._id});
  loan.outstandingAmount-=Number(amount);loan.payments.push({amount,account,date:date||new Date(),transaction:tx._id});refreshStatus(loan);await loan.save();res.json({success:true,loan,transaction:tx});
});
const remove=asyncHandler(async(req,res)=>{const loan=await Loan.findOne({_id:req.params.id,user:req.user._id});if(!loan){res.status(404);throw new Error('Préstamo no encontrado');}if(loan.payments.length){res.status(400);throw new Error('No puedes eliminar un préstamo con cobros registrados');}await Transaction.deleteMany({user:req.user._id,sourceModel:'Loan',sourceId:loan._id});await loan.deleteOne();res.json({success:true,message:'Préstamo eliminado'});});
module.exports={list,create,update,receivePayment,remove};
