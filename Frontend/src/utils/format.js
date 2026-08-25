export const money=(value=0)=>new Intl.NumberFormat('es-SV',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(value)||0);
export const date=(value)=>value?new Intl.DateTimeFormat('es-SV',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)):'—';
export const todayInput=()=>new Date().toISOString().slice(0,10);
export const txLabels={income:'Ingreso',expense:'Gasto',extra:'Extra',transfer:'Transferencia',debt_payment:'Pago de deuda',loan_given:'Préstamo entregado',loan_repayment:'Cobro de préstamo'};
export const accountLabels={cash:'Efectivo',bank:'Banco',savings:'Ahorros',wallet:'Billetera',other:'Otra'};