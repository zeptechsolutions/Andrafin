const Debt=require('../models/Debt');
const Loan=require('../models/Loan');
const Receivable=require('../models/Receivable');
const Recurring=require('../models/RecurringTransaction');
const Notification=require('../models/Notification');
const User=require('../models/User');
const {sendEmail}=require('./emailService');

const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const daysBetween=(a,b)=>Math.round((startOfDay(b)-startOfDay(a))/86400000);

const createNotice=async({user,type,title,message,model,id,key})=>{
  let n;
  try{
    n=await Notification.create({
      user:user._id,type,title,message,relatedModel:model,relatedId:id,notificationKey:key
    });
  }catch(e){
    if(e.code===11000)return null;
    throw e;
  }

  if(user.notifications?.email){
    try{
      const r=await sendEmail({
        to:user.email,
        subject:title,
        html:`<div style="font-family:Arial,sans-serif"><h2>${title}</h2><p>${message}</p><p>— AndraFin</p></div>`
      });
      if(!r.skipped){n.emailSent=true;await n.save();}
    }catch(e){
      console.error('No se pudo enviar correo:',e.message);
    }
  }
  return n;
};

const runReminders=async()=>{
  const today=new Date();
  const users=await User.find({});

  for(const user of users){
    const days=user.notifications?.daysBeforeDue?.length?user.notifications.daysBeforeDue:[3,1,0];

    const [debts,loans,receivables,recurring]=await Promise.all([
      Debt.find({user:user._id,status:{$ne:'paid'},dueDate:{$ne:null}}),
      Loan.find({user:user._id,status:{$ne:'paid'},dueDate:{$ne:null}}),
      Receivable.find({user:user._id,status:{$ne:'paid'},expectedDate:{$ne:null}}),
      Recurring.find({user:user._id,isActive:true,nextDate:{$ne:null}})
    ]);

    for(const d of debts){
      const diff=daysBetween(today,d.dueDate);
      if(diff<0){
        d.status='overdue';await d.save();
        await createNotice({
          user,type:'debt_overdue',title:'Deuda vencida',
          message:`${d.concept} tiene $${d.outstandingAmount.toFixed(2)} pendientes y ya venció.`,
          model:'Debt',id:d._id,key:`debt:${d._id}:overdue:${startOfDay(today).toISOString()}`
        });
      }else if(days.includes(diff)){
        await createNotice({
          user,type:'debt_due',title:'Pago próximo',
          message:`${d.concept} por $${d.outstandingAmount.toFixed(2)} vence ${diff===0?'hoy':`en ${diff} día(s)`}.`,
          model:'Debt',id:d._id,key:`debt:${d._id}:due:${diff}:${startOfDay(today).toISOString()}`
        });
      }
    }

    for(const l of loans){
      const diff=daysBetween(today,l.dueDate);
      if(diff<0){
        l.status='overdue';await l.save();
        await createNotice({
          user,type:'loan_overdue',title:'Préstamo vencido',
          message:`El préstamo a ${l.borrower} tiene $${l.outstandingAmount.toFixed(2)} pendientes de cobro.`,
          model:'Loan',id:l._id,key:`loan:${l._id}:overdue:${startOfDay(today).toISOString()}`
        });
      }else if(days.includes(diff)){
        await createNotice({
          user,type:'loan_due',title:'Cobro próximo',
          message:`El préstamo a ${l.borrower} por $${l.outstandingAmount.toFixed(2)} vence ${diff===0?'hoy':`en ${diff} día(s)`}.`,
          model:'Loan',id:l._id,key:`loan:${l._id}:due:${diff}:${startOfDay(today).toISOString()}`
        });
      }
    }

    for(const r of receivables){
      const diff=daysBetween(today,r.expectedDate);
      if(diff<0){
        r.status='overdue';await r.save();
        await createNotice({
          user,type:'receivable_overdue',title:'Cobro pendiente vencido',
          message:`Esperabas recibir $${r.outstandingAmount.toFixed(2)} de ${r.payer} por ${r.concept}.`,
          model:'Receivable',id:r._id,key:`receivable:${r._id}:overdue:${startOfDay(today).toISOString()}`
        });
      }else if(days.includes(diff)){
        await createNotice({
          user,type:'receivable_due',title:'Dinero por recibir',
          message:`Esperas recibir $${r.outstandingAmount.toFixed(2)} de ${r.payer} por ${r.concept} ${diff===0?'hoy':`en ${diff} día(s)`}.`,
          model:'Receivable',id:r._id,key:`receivable:${r._id}:due:${diff}:${startOfDay(today).toISOString()}`
        });
      }
    }

    for(const r of recurring){
      const diff=daysBetween(today,r.nextDate);
      if(days.includes(diff)){
        await createNotice({
          user,type:'recurring_due',title:'Movimiento recurrente próximo',
          message:`${r.concept} por $${r.amount.toFixed(2)} corresponde ${diff===0?'hoy':`en ${diff} día(s)`}.`,
          model:'RecurringTransaction',id:r._id,key:`recurring:${r._id}:due:${diff}:${startOfDay(today).toISOString()}`
        });
      }
    }
  }
};

module.exports={runReminders};
