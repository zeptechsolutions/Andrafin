import {Link} from 'react-router-dom';
import {WalletCards,Target,Tags,Bell,UserRound,ChevronRight} from 'lucide-react';

const links=[
  ['/cuentas','Cuentas','Administra efectivo, bancos y ahorros',WalletCards],
  ['/categorias','Categorías','Organiza ingresos y gastos',Tags],
  ['/planificacion','Planificación','Presupuestos, metas y recurrentes',Target],
  ['/notificaciones','Notificaciones','Vencimientos y recordatorios',Bell],
  ['/perfil','Perfil','Cuenta, seguridad y preferencias',UserRound],
];

export default function More(){
  return <section className="panel">
    <div className="panel-head">
      <div><p className="eyebrow">AndraFin</p><h2>Más herramientas</h2></div>
    </div>
    <div className="more-list">
      {links.map(([to,title,text,I])=>
        <Link to={to} className="more-row" key={to}>
          <div className="stat-icon"><I size={19}/></div>
          <div className="grow"><strong>{title}</strong><span>{text}</span></div>
          <ChevronRight size={18}/>
        </Link>
      )}
    </div>
  </section>;
}
