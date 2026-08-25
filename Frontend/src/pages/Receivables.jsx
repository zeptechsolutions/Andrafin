import {useEffect,useState} from 'react';
import api from '../services/api';
import {money,date,todayInput} from '../utils/format';
import {Plus,WalletMinimal,Trash2} from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const statusLabel=s=>({
  pending:'Pendiente',
  partial:'Parcial',
  paid:'Recibido',
  overdue:'Vencido'
}[s]||s);

export default function Receivables({bump}){
  const [items,setItems]=useState([]);
  const [accounts,setAccounts]=useState([]);
  const [open,setOpen]=useState(false);
  const [pay,setPay]=useState(null);

  const load=()=>Promise.all([api.get('/receivables'),api.get('/accounts')])
    .then(([r,a])=>{
      setItems(r.data.receivables);
      setAccounts(a.data.accounts);
    });

  useEffect(()=>{load();},[]);

  const remove=async id=>{
    if(!confirm('¿Eliminar este dinero por cobrar?'))return;
    try{
      await api.delete(`/receivables/${id}`);
      load();
    }catch(e){
      alert(e.response?.data?.message||'No se pudo eliminar');
    }
  };

  const pendingTotal=items
    .filter(x=>x.status!=='paid')
    .reduce((sum,x)=>sum+(x.outstandingAmount||0),0);

  return <>
    <section className="receivable-summary">
      <div>
        <p className="eyebrow gold">DINERO ESPERADO</p>
        <h2>{money(pendingTotal)}</h2>
        <p>No se suma a tu saldo hasta que realmente lo recibas.</p>
      </div>
      <WalletMinimal size={28}/>
    </section>

    <div className="section-actions">
      <p className="muted">Registra dinero que todavía no tienes, pero esperas recibir.</p>
      <button className="btn primary" onClick={()=>setOpen(true)}><Plus size={18}/>Nuevo cobro</button>
    </div>

    {items.length?
      <div className="card-grid two">
        {items.map(item=>
          <article className="finance-card" key={item._id}>
            <div className="finance-head">
              <div>
                <span className={`status ${item.status}`}>{statusLabel(item.status)}</span>
                <h3>{item.concept}</h3>
                <p>{item.payer}</p>
              </div>
              <WalletMinimal size={22}/>
            </div>

            <div className="finance-numbers">
              <div><span>Por recibir</span><strong>{money(item.outstandingAmount)}</strong></div>
              <div><span>Total</span><strong>{money(item.originalAmount)}</strong></div>
            </div>

            <div className="progress">
              <span style={{width:`${Math.min(100,(1-item.outstandingAmount/item.originalAmount)*100)}%`}}/>
            </div>

            <p className="due">Fecha esperada: {date(item.expectedDate)}</p>

            <div className="card-actions">
              <button className="btn secondary" disabled={item.status==='paid'} onClick={()=>setPay(item)}>
                Registrar ingreso
              </button>
              <button className="icon-btn danger" onClick={()=>remove(item._id)} aria-label="Eliminar">
                <Trash2 size={17}/>
              </button>
            </div>
          </article>
        )}
      </div>
      :
      <EmptyState
        title="Nada por cobrar"
        text="Cuando esperes un pago futuro, agrégalo aquí. No afectará tu saldo hasta que lo recibas."
      />
    }

    <ReceivableCreate
      open={open}
      onClose={()=>setOpen(false)}
      onSaved={()=>{load();bump?.();}}
    />

    <ReceiveModal
      open={!!pay}
      item={pay}
      accounts={accounts}
      onClose={()=>setPay(null)}
      onSaved={()=>{load();bump?.();}}
    />
  </>;
}

function ReceivableCreate({open,onClose,onSaved}){
  const initial={payer:'',concept:'',originalAmount:'',expectedDate:'',notes:''};
  const [f,setF]=useState(initial);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  const submit=async e=>{
    e.preventDefault();
    setBusy(true);
    setError('');
    try{
      await api.post('/receivables',{...f,originalAmount:Number(f.originalAmount)});
      setF(initial);
      onSaved();
      onClose();
    }catch(err){
      setError(err.response?.data?.message||'No se pudo guardar');
    }finally{
      setBusy(false);
    }
  };

  return <Modal open={open} onClose={onClose} title="Nuevo dinero por cobrar">
    <form className="form-grid" onSubmit={submit}>
      <label>Quién te pagará
        <input value={f.payer} onChange={e=>setF({...f,payer:e.target.value})} placeholder="Persona o entidad" required/>
      </label>
      <label>Monto
        <input type="number" min="0.01" step="0.01" value={f.originalAmount} onChange={e=>setF({...f,originalAmount:e.target.value})} placeholder="0.00" required/>
      </label>
      <label className="full">Concepto
        <input value={f.concept} onChange={e=>setF({...f,concept:e.target.value})} placeholder="Ej. Pago pendiente" required/>
      </label>
      <label>Fecha esperada
        <input type="date" value={f.expectedDate} onChange={e=>setF({...f,expectedDate:e.target.value})}/>
      </label>
      <label className="full">Notas
        <textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Opcional"/>
      </label>
      {error&&<p className="form-error full">{error}</p>}
      <div className="form-actions full">
        <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={busy}>{busy?'Guardando...':'Guardar'}</button>
      </div>
    </form>
  </Modal>;
}

function ReceiveModal({open,item,accounts,onClose,onSaved}){
  const [f,setF]=useState({amount:'',account:'',date:todayInput()});
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    if(open){
      setF({amount:'',account:'',date:todayInput()});
      setError('');
    }
  },[open]);

  if(!item)return null;

  const submit=async e=>{
    e.preventDefault();
    setBusy(true);
    setError('');
    try{
      await api.post(`/receivables/${item._id}/payments`,{
        amount:Number(f.amount),
        account:f.account,
        date:f.date
      });
      onSaved();
      onClose();
    }catch(err){
      setError(err.response?.data?.message||'No se pudo registrar el ingreso');
    }finally{
      setBusy(false);
    }
  };

  return <Modal open={open} onClose={onClose} title="Registrar dinero recibido">
    <form className="form-grid" onSubmit={submit}>
      <div className="full receivable-note">
        <span>Pendiente</span>
        <strong>{money(item.outstandingAmount)}</strong>
        <small>Al guardar, este monto sí entrará a la cuenta seleccionada.</small>
      </div>
      <label>Monto recibido
        <input type="number" min="0.01" max={item.outstandingAmount} step="0.01" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/>
      </label>
      <label>Cuenta de ingreso
        <select value={f.account} onChange={e=>setF({...f,account:e.target.value})} required>
          <option value="">Selecciona</option>
          {accounts.filter(a=>a.isActive).map(a=><option key={a._id} value={a._id}>{a.name}</option>)}
        </select>
      </label>
      <label>Fecha
        <input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
      </label>
      {error&&<p className="form-error full">{error}</p>}
      <div className="form-actions full">
        <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={busy}>{busy?'Guardando...':'Registrar ingreso'}</button>
      </div>
    </form>
  </Modal>;
}
