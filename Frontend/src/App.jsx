import {Navigate, Route, Routes} from 'react-router-dom';
import {useState} from 'react';
import {useAuth} from './context/AuthContext';
import Layout from './components/Layout';
import TransactionForm from './components/TransactionForm';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Debts from './pages/Debts';
import Loans from './pages/Loans';
import Receivables from './pages/Receivables';
import Planning from './pages/Planning';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import More from './pages/More';
import Categories from './pages/Categories';

function Splash(){
  return <div className="splash"><img className="splash-logo" src="/andrafin-logo-ui.jpg" alt="AndraFin"/><strong>AndraFin</strong></div>;
}

function PrivateApp(){
  const [quick,setQuick]=useState(false);
  const [refresh,setRefresh]=useState(0);
  const bump=()=>setRefresh(x=>x+1);

  return <>
    <Layout onQuickAdd={()=>setQuick(true)}>
      <Routes>
        <Route path="/" element={<Dashboard refresh={refresh}/>}/>
        <Route path="/movimientos" element={<Transactions refresh={refresh} bump={bump}/>}/>
        <Route path="/cuentas" element={<Accounts/>}/>
        <Route path="/categorias" element={<Categories/>}/>
        <Route path="/deudas" element={<Debts bump={bump}/>}/>
        <Route path="/prestamos" element={<Loans bump={bump}/>}/>
        <Route path="/por-cobrar" element={<Receivables bump={bump}/>}/>
        <Route path="/planificacion" element={<Planning/>}/>
        <Route path="/notificaciones" element={<Notifications/>}/>
        <Route path="/perfil" element={<Profile/>}/>
        <Route path="/mas" element={<More/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </Layout>
    <TransactionForm open={quick} onClose={()=>setQuick(false)} onSaved={bump}/>
  </>;
}

export default function App(){
  const {user,loading}=useAuth();

  if(loading) return <Splash/>;

  if(!user){
    return <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>
      <Route path="*" element={<Navigate to="/login" replace/>}/>
    </Routes>;
  }

  return <PrivateApp/>;
}
