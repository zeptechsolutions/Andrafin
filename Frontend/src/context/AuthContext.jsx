import {createContext,useContext,useEffect,useState} from 'react';
import api from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('andrafin_user')||'null'));const [loading,setLoading]=useState(true);
useEffect(()=>{const token=localStorage.getItem('andrafin_token');if(!token){setLoading(false);return;}api.get('/auth/me').then(({data})=>{setUser(data.user);localStorage.setItem('andrafin_user',JSON.stringify(data.user));}).catch(()=>{localStorage.removeItem('andrafin_token');localStorage.removeItem('andrafin_user');setUser(null);}).finally(()=>setLoading(false));},[]);
const persist=data=>{localStorage.setItem('andrafin_token',data.token);localStorage.setItem('andrafin_user',JSON.stringify(data.user));setUser(data.user);};
const login=async body=>{const {data}=await api.post('/auth/login',body);persist(data);};const register=async body=>{const {data}=await api.post('/auth/register',body);persist(data);};const logout=()=>{localStorage.removeItem('andrafin_token');localStorage.removeItem('andrafin_user');setUser(null);};
return <AuthContext.Provider value={{user,setUser,loading,login,register,logout}}>{children}</AuthContext.Provider>};
export const useAuth=()=>useContext(AuthContext);