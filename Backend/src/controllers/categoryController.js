const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req,res)=>res.json({success:true,categories:await Category.find({user:req.user._id}).sort({name:1})}));
const create = asyncHandler(async(req,res)=>{
  const {name,kind}=req.body; if(!name){res.status(400);throw new Error('Nombre obligatorio');}
  res.status(201).json({success:true,category:await Category.create({user:req.user._id,name,kind})});
});
const update = asyncHandler(async(req,res)=>{
  const item=await Category.findOneAndUpdate({_id:req.params.id,user:req.user._id},req.body,{new:true,runValidators:true});
  if(!item){res.status(404);throw new Error('Categoría no encontrada');} res.json({success:true,category:item});
});
const remove = asyncHandler(async(req,res)=>{
  const item=await Category.findOneAndDelete({_id:req.params.id,user:req.user._id});
  if(!item){res.status(404);throw new Error('Categoría no encontrada');} res.json({success:true,message:'Categoría eliminada'});
});
module.exports={list,create,update,remove};
