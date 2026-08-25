const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

const validateRefs = async (userId, body) => {
  if (body.account && !(await Account.exists({ _id: body.account, user: userId }))) throw new Error('Cuenta inválida');
  if (body.destinationAccount && !(await Account.exists({ _id: body.destinationAccount, user: userId }))) throw new Error('Cuenta destino inválida');
  if (body.category && !(await Category.exists({ _id: body.category, user: userId }))) throw new Error('Categoría inválida');
};

const list = asyncHandler(async (req,res)=>{
  const { type, account, category, from, to, page=1, limit=50 } = req.query;
  const q={user:req.user._id};
  if(type) q.type=type; if(account) q.account=account; if(category) q.category=category;
  if(from||to){ q.date={}; if(from) q.date.$gte=new Date(from); if(to){ const d=new Date(to); d.setHours(23,59,59,999); q.date.$lte=d; } }
  const skip=(Math.max(Number(page),1)-1)*Math.min(Number(limit),100);
  const [transactions,total]=await Promise.all([
    Transaction.find(q).populate('account','name type').populate('destinationAccount','name type').populate('category','name kind').sort({date:-1,createdAt:-1}).skip(skip).limit(Math.min(Number(limit),100)),
    Transaction.countDocuments(q)
  ]);
  res.json({success:true,transactions,pagination:{page:Number(page),limit:Math.min(Number(limit),100),total,pages:Math.ceil(total/Math.min(Number(limit),100))}});
});

const create = asyncHandler(async(req,res)=>{
  const body={...req.body,user:req.user._id};
  if(!body.type||!body.amount||!body.concept){res.status(400);throw new Error('Tipo, monto y concepto son obligatorios');}
  if(body.type==='transfer'){
    if(!body.account||!body.destinationAccount){res.status(400);throw new Error('Una transferencia requiere cuenta origen y destino');}
    if(String(body.account)===String(body.destinationAccount)){res.status(400);throw new Error('Las cuentas de una transferencia deben ser diferentes');}
  } else if(!body.account){res.status(400);throw new Error('La cuenta es obligatoria');}
  await validateRefs(req.user._id,body);
  const item=await Transaction.create(body);
  res.status(201).json({success:true,transaction:await item.populate(['account','destinationAccount','category'])});
});
const update = asyncHandler(async(req,res)=>{
  await validateRefs(req.user._id,req.body);
  const item=await Transaction.findOneAndUpdate({_id:req.params.id,user:req.user._id,sourceId:null},req.body,{new:true,runValidators:true});
  if(!item){res.status(404);throw new Error('Movimiento no encontrado o generado por otro módulo');}
  res.json({success:true,transaction:item});
});
const remove = asyncHandler(async(req,res)=>{
  const item=await Transaction.findOneAndDelete({_id:req.params.id,user:req.user._id,sourceId:null});
  if(!item){res.status(404);throw new Error('Movimiento no encontrado o generado por otro módulo');}
  res.json({success:true,message:'Movimiento eliminado'});
});
module.exports={list,create,update,remove};
