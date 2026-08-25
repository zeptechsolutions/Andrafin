import {useEffect,useState} from 'react';
import api from '../services/api';
import {money,date,txLabels} from '../utils/format';
import {ArrowDownLeft,ArrowUpRight,Scale,Landmark,HandCoins,WalletCards,WalletMinimal} from 'lucide-react';
import EmptyState from '../components/EmptyState';

const incomingTypes=['income','extra','loan_repayment','receivable_payment'];

export default function Dashboard({refresh}){
  const [data,setData]=useState(null);
  const [accounts,setAccounts]=useState([]);

  useEffect(()=>{
    Promise.all([api.get('/dashboard'),api.get('/accounts')])
      .then(([d,a])=>{
        setData(d.data);
        setAccounts(a.data.accounts);
      });
  },[refresh]);

  if(!data)return <div className="skeleton-grid"><div/><div/><div/><div/></div>;

  const s=data.summary;
  const totalCash=accounts.reduce((n,a)=>n+(a.balance||0),0);

  return <>
    <section className="hero-card">
      <div>
        <p className="eyebrow gold">Patrimonio disponible</p>
        <h2>{money(totalCash)}</h2>
        <p>Saldo consolidado de tus cuentas activas. El dinero pendiente por cobrar no se incluye aquí.</p>
      </div>
      <div className="hero-seal"><span>A</span><small>ANDRAFIN</small></div>
    </section>

    <section className="stat-grid">
      <Stat icon={ArrowDownLeft} label="Ingresos del mes" value={money(s.income)} tone="positive"/>
      <Stat icon={ArrowUpRight} label="Egresos del mes" value={money(s.expenses)} tone="negative"/>
      <Stat icon={Scale} label="Balance del mes" value={money(s.balance)}/>
      <Stat icon={WalletMinimal} label="Por cobrar" value={money(s.outstandingReceivables)}/>
      <Stat icon={Landmark} label="Deudas pendientes" value={money(s.outstandingDebts)}/>
      <Stat icon={HandCoins} label="Préstamos por recuperar" value={money(s.outstandingLoans)}/>
      <Stat icon={WalletCards} label="Cuentas activas" value={s.activeAccounts}/>
    </section>

    <div className="dashboard-grid">
      <section className="panel">
        <div className="panel-head">
          <div><p className="eyebrow">Actividad</p><h2>Movimientos recientes</h2></div>
        </div>
        {data.recentTransactions.length?
          <div className="list">
            {data.recentTransactions.map(t=>{
              const incoming=incomingTypes.includes(t.type);
              return <div className="list-row" key={t._id}>
                <div className={`tx-icon ${incoming?'in':'out'}`}>
                  {incoming?<ArrowDownLeft size={18}/>:<ArrowUpRight size={18}/>}
                </div>
                <div className="grow">
                  <strong>{t.concept}</strong>
                  <span>{t.account?.name||'Sin cuenta'} · {date(t.date)}</span>
                </div>
                <div className="amount">
                  <strong>{money(t.amount)}</strong>
                  <span>{txLabels[t.type]||t.type}</span>
                </div>
              </div>
            })}
          </div>
          :
          <EmptyState/>
        }
      </section>

      <section className="panel">
        <div className="panel-head">
          <div><p className="eyebrow">Distribución</p><h2>Principales gastos</h2></div>
        </div>
        {data.topExpenseCategories.length?
          <div className="bars">
            {data.topExpenseCategories.map(c=>{
              const max=data.topExpenseCategories[0]?.total||1;
              return <div className="bar-item" key={c._id}>
                <div><span>{c.name}</span><strong>{money(c.total)}</strong></div>
                <div className="bar-track"><span style={{width:`${Math.max(8,c.total/max*100)}%`}}/></div>
              </div>
            })}
          </div>
          :
          <EmptyState title="Sin gastos categorizados" text="Tus principales categorías aparecerán al registrar gastos."/>
        }
      </section>
    </div>
  </>;
}

function Stat({icon:Icon,label,value,tone=''}){
  return <div className={`stat-card ${tone}`}>
    <div className="stat-icon"><Icon size={19}/></div>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>;
}
