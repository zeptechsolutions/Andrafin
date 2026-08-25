const Transaction=require('../models/Transaction');
const Debt=require('../models/Debt');
const Loan=require('../models/Loan');
const Receivable=require('../models/Receivable');
const Account=require('../models/Account');
const asyncHandler=require('../utils/asyncHandler');

const getDashboard=asyncHandler(async(req,res)=>{
  const now=new Date();
  const month=Number(req.query.month)||now.getMonth()+1;
  const year=Number(req.query.year)||now.getFullYear();
  const start=new Date(year,month-1,1),end=new Date(year,month,1);

  const totals=await Transaction.aggregate([
    {$match:{user:req.user._id,date:{$gte:start,$lt:end}}},
    {$group:{_id:'$type',total:{$sum:'$amount'},count:{$sum:1}}}
  ]);
  const t=Object.fromEntries(totals.map(x=>[x._id,{total:x.total,count:x.count}]));

  const income=(t.income?.total||0)+(t.extra?.total||0)+(t.loan_repayment?.total||0)+(t.receivable_payment?.total||0);
  const expenses=(t.expense?.total||0)+(t.debt_payment?.total||0)+(t.loan_given?.total||0);

  const [debts,loans,receivables,accounts,recent]=await Promise.all([
    Debt.aggregate([{$match:{user:req.user._id,status:{$ne:'paid'}}},{$group:{_id:null,total:{$sum:'$outstandingAmount'}}}]),
    Loan.aggregate([{$match:{user:req.user._id,status:{$ne:'paid'}}},{$group:{_id:null,total:{$sum:'$outstandingAmount'}}}]),
    Receivable.aggregate([{$match:{user:req.user._id,status:{$ne:'paid'}}},{$group:{_id:null,total:{$sum:'$outstandingAmount'}}}]),
    Account.countDocuments({user:req.user._id,isActive:true}),
    Transaction.find({user:req.user._id})
      .populate('account','name')
      .populate('category','name')
      .sort({date:-1})
      .limit(8)
  ]);

  const categories=await Transaction.aggregate([
    {$match:{user:req.user._id,type:'expense',date:{$gte:start,$lt:end},category:{$ne:null}}},
    {$group:{_id:'$category',total:{$sum:'$amount'}}},
    {$sort:{total:-1}},
    {$limit:5},
    {$lookup:{from:'categories',localField:'_id',foreignField:'_id',as:'category'}},
    {$unwind:'$category'},
    {$project:{name:'$category.name',total:1}}
  ]);

  res.json({
    success:true,
    period:{month,year},
    summary:{
      income,
      expenses,
      balance:income-expenses,
      outstandingDebts:debts[0]?.total||0,
      outstandingLoans:loans[0]?.total||0,
      outstandingReceivables:receivables[0]?.total||0,
      activeAccounts:accounts
    },
    byType:t,
    topExpenseCategories:categories,
    recentTransactions:recent
  });
});

module.exports={getDashboard};
