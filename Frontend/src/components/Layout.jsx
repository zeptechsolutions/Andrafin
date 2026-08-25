import {NavLink,useLocation,Link} from 'react-router-dom';
import {
  LayoutDashboard,ArrowLeftRight,WalletCards,HandCoins,Landmark,
  Target,Bell,UserRound,LogOut,Plus,Menu,Tags,WalletMinimal
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';

const nav=[
  ['/', 'Resumen', LayoutDashboard],
  ['/movimientos','Movimientos',ArrowLeftRight],
  ['/cuentas','Cuentas',WalletCards],
  ['/categorias','Categorías',Tags],
  ['/deudas','Deudas',Landmark],
  ['/prestamos','Préstamos',HandCoins],
  ['/por-cobrar','Por cobrar',WalletMinimal],
  ['/planificacion','Planificación',Target],
  ['/notificaciones','Avisos',Bell],
  ['/perfil','Perfil',UserRound],
];

const mobile=[
  ['/','Inicio',LayoutDashboard],
  ['/movimientos','Movimientos',ArrowLeftRight],
  ['/deudas','Deudas',Landmark],
  ['/prestamos','Préstamos',HandCoins],
  ['/mas','Más',Menu],
];

export default function Layout({children,onQuickAdd}){
  const {user,logout}=useAuth();
  const loc=useLocation();
  const current=nav.find(([p])=>p==='/' ? loc.pathname==='/' : loc.pathname.startsWith(p));

  return <div className="app-shell">
    <aside className="sidebar">
      <Link to="/" className="brand">
        <img className="brand-logo" src="/andrafin-logo-ui.jpg" alt="AndraFin"/>
        <div><strong>AndraFin</strong><span>Finanzas personales</span></div>
      </Link>

      <nav className="sidebar-nav">
        {nav.map(([p,l,I])=>
          <NavLink key={p} to={p} end={p==='/'}
            className={({isActive})=>isActive?'active':''}>
            <I size={19}/><span>{l}</span>
          </NavLink>
        )}
      </nav>

      <button className="logout" onClick={logout}><LogOut size={18}/>Cerrar sesión</button>
    </aside>

    <main className="main">
      <header className="topbar">
        <div>
          <p className="eyebrow">AndraFin</p>
          <h1>{current?.[1] || (loc.pathname==='/mas' ? 'Más' : 'AndraFin')}</h1>
        </div>
        <div className="top-actions">
          <Link className="icon-btn top-bell" to="/notificaciones" aria-label="Notificaciones"><Bell size={18}/></Link>
          <button className="btn primary compact" onClick={onQuickAdd}><Plus size={18}/><span>Movimiento</span></button>
          <Link className="avatar" to="/perfil" aria-label="Perfil">{user?.name?.charAt(0)?.toUpperCase()||'A'}</Link>
        </div>
      </header>

      <div className="content">{children}</div>
    </main>

    <nav className="bottom-nav">
      {mobile.map(([p,l,I])=>
        <NavLink key={p} to={p} end={p==='/'}
          className={({isActive})=>isActive?'active':''}>
          <I size={20}/><span>{l}</span>
        </NavLink>
      )}
    </nav>
  </div>;
}
