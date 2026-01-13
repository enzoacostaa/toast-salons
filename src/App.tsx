import { useState, useMemo, useEffect } from 'react';
import { 
  Users, Clock, CreditCard, Banknote, QrCode, LayoutDashboard, 
  Plus, Trash2, Edit2, ChevronRight, CheckCircle2, AlertCircle, 
  X, TrendingUp, Wallet, DollarSign, Scissors, ChevronLeft
} from 'lucide-react';

// --- CONFIGURACIÓN & TIPOS ---

interface Employee {
  id: number;
  name: string;
  role: string;
  defaultCommission: number; 
  avatar: string;
  color: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  category: 'Corte' | 'Color' | 'Tratamiento';
  specialCommission: number | null;
}

interface Transaction {
  id: string;
  date: string;
  employeeId: number;
  employeeName: string;
  services: Service[];
  total: number;
  commissionAmount: number;
  salonMargin: number;
  paymentMethod: 'Efectivo' | 'QR' | 'Débito' | 'Crédito';
  checkInTime: string;
  checkOutTime: string;
}

// --- BASE DE DATOS MOCK (Simulada) ---

const EMPLOYEES: Employee[] = [
  { id: 1, name: 'María', role: 'Estilista Senior', defaultCommission: 0.45, avatar: '👩‍🦰', color: 'bg-rose-500' },
  { id: 2, name: 'Juan', role: 'Barbero', defaultCommission: 0.40, avatar: '👨‍🦱', color: 'bg-blue-500' },
  { id: 3, name: 'Laura', role: 'Colorista', defaultCommission: 0.42, avatar: '👩‍🦳', color: 'bg-purple-500' },
  { id: 4, name: 'Lucas', role: 'Junior', defaultCommission: 0.30, avatar: '👨‍🦲', color: 'bg-emerald-500' },
];

const SERVICES: Service[] = [
  { id: 1, name: 'Corte Mujer', price: 12000, category: 'Corte', specialCommission: null },
  { id: 2, name: 'Corte Hombre', price: 8000, category: 'Corte', specialCommission: null },
  { id: 3, name: 'Alisado', price: 50000, category: 'Tratamiento', specialCommission: 0.20 },
  { id: 4, name: 'Color Raíz', price: 22000, category: 'Color', specialCommission: 0.35 },
  { id: 5, name: 'Balayage', price: 45000, category: 'Color', specialCommission: 0.35 },
  { id: 6, name: 'Nutrición', price: 10000, category: 'Tratamiento', specialCommission: null },
];

// --- UTILIDADES ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

// --- COMPONENTE PRINCIPAL ---

export default function ToastApp() {
  // Estado General
  const [view, setView] = useState<'dashboard' | 'checkout'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Estado del Wizard (Checkout)
  const [step, setStep] = useState(0);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [timeData, setTimeData] = useState({ checkIn: '', checkOut: '' });

  // Efecto para notificaciones temporales
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Cálculos KPIs (Memoizados para rendimiento)
  const stats = useMemo(() => {
    return transactions.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.total,
      commission: acc.commission + curr.commissionAmount,
      margin: acc.margin + curr.salonMargin,
      count: acc.count + 1
    }), { revenue: 0, commission: 0, margin: 0, count: 0 });
  }, [transactions]);

  // Cálculos en Tiempo Real del Checkout
  const currentFinancials = useMemo(() => {
    if (!selectedEmp) return { total: 0, commission: 0, margin: 0 };
    
    let total = 0;
    let commission = 0;

    selectedServices.forEach(srv => {
      total += srv.price;
      // Prioridad: Comisión especial del servicio > Comisión base del empleado
      const rate = srv.specialCommission !== null ? srv.specialCommission : selectedEmp.defaultCommission;
      commission += srv.price * rate;
    });

    return { total, commission, margin: total - commission };
  }, [selectedEmp, selectedServices]);

  // --- ACCIONES ---

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
  };

  const startCheckout = () => {
    // Reset total del estado de checkout
    setEditingTxId(null);
    setSelectedEmp(null);
    setSelectedServices([]);
    setTimeData({ checkIn: getCurrentTime(), checkOut: getCurrentTime() });
    setStep(0);
    setView('checkout');
  };

  const handleEditTransaction = (tx: Transaction) => {
    const emp = EMPLOYEES.find(e => e.id === tx.employeeId) || null;
    setEditingTxId(tx.id);
    setSelectedEmp(emp);
    setSelectedServices(tx.services);
    setTimeData({ checkIn: tx.checkInTime, checkOut: tx.checkOutTime });
    setStep(0);
    setView('checkout');
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('¿Borrar esta transacción permanentemente?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showNotification('Transacción eliminada', 'success');
    }
  };

  const handlePayment = (method: Transaction['paymentMethod']) => {
    if (!selectedEmp) return;

    const newTx: Transaction = {
      id: editingTxId || crypto.randomUUID(), // ID único más seguro
      date: new Date().toISOString(),
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      services: selectedServices,
      total: currentFinancials.total,
      commissionAmount: currentFinancials.commission,
      salonMargin: currentFinancials.margin,
      paymentMethod: method,
      checkInTime: timeData.checkIn,
      checkOutTime: timeData.checkOut
    };

    if (editingTxId) {
      setTransactions(prev => prev.map(t => t.id === editingTxId ? newTx : t));
      showNotification('Venta actualizada', 'success');
    } else {
      setTransactions(prev => [newTx, ...prev]);
      showNotification('¡Venta registrada!', 'success');
    }

    setView('dashboard');
  };

  const toggleService = (srv: Service) => {
    const exists = selectedServices.some(s => s.id === srv.id);
    if (exists) {
      setSelectedServices(prev => prev.filter(s => s.id !== srv.id));
    } else {
      setSelectedServices(prev => [...prev, srv]);
    }
  };

  // --- RENDERIZADO ---

  // VISTA: DASHBOARD
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30">
        <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-24">
          
          {/* Header */}
          <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-gradient-to-b from-slate-900/80 to-transparent sticky top-0 z-10 backdrop-blur-sm">
            <div>
              <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
                TOAST.
              </h1>
              <p className="text-slate-400 text-xs font-medium tracking-wide">SALON MANAGEMENT</p>
            </div>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
              <Scissors className="text-violet-400 w-5 h-5" />
            </div>
          </header>

          <main className="px-4 space-y-6 flex-1">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/20 transition-all duration-500"></div>
                <div className="flex items-center gap-2 mb-1 text-slate-400">
                  <DollarSign className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Hoy</span>
                </div>
                <div className="text-4xl font-black text-white tracking-tight mb-1">
                  {formatCurrency(stats.revenue)}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    +{stats.count} ventas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Wallet className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-bold uppercase">Comisiones</span>
                  </div>
                  <div className="text-lg font-bold text-orange-100/90">
                    {formatCurrency(stats.commission)}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/5"></div>
                  <div className="flex items-center gap-2 mb-2 text-slate-400 relative z-10">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase">Margen</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-100/90 relative z-10">
                    {formatCurrency(stats.margin)}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <button 
              onClick={startCheckout}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-lg shadow-violet-900/30 active:scale-[0.98] transition-all hover:shadow-violet-900/50 group"
            >
              <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                <Plus className="w-5 h-5" />
              </div>
              NUEVO COBRO
            </button>

            {/* Lista de Transacciones */}
            <div className="space-y-3 pb-8">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest pl-1">Actividad Reciente</h3>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <LayoutDashboard className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-slate-400 font-medium">Sin movimientos hoy</p>
                  <p className="text-slate-600 text-sm mt-1">Tu salón está listo para facturar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice().reverse().map(tx => (
                    <div key={tx.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center hover:border-slate-700 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl relative">
                          {EMPLOYEES.find(e => e.id === tx.employeeId)?.avatar}
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold ${
                             tx.paymentMethod === 'Efectivo' ? 'bg-emerald-500 text-emerald-950' : 
                             tx.paymentMethod === 'QR' ? 'bg-blue-500 text-blue-950' : 'bg-purple-500 text-purple-950'
                          }`}>
                            {tx.paymentMethod === 'Efectivo' ? '$' : tx.paymentMethod === 'QR' ? 'Q' : 'T'}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white leading-tight">{tx.employeeName}</div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-col">
                            <span>{tx.services.length} servicios</span>
                            <span className="font-mono opacity-70">{tx.checkInTime} - {tx.checkOutTime}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-white text-lg tracking-tight">{formatCurrency(tx.total)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => handleEditTransaction(tx)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400 transition-colors">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDeleteTransaction(tx.id)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Notificación Toast */}
          {notification && (
            <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-in backdrop-blur-md border ${
              notification.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/50' : 'bg-red-500/90 text-white border-red-400/50'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm shadow-black/10 text-shadow">{notification.msg}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VISTA: CHECKOUT (WIZARD)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <div className="max-w-md mx-auto w-full h-screen flex flex-col relative">
        
        {/* Navbar del Wizard */}
        <div className="p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <button onClick={() => step > 0 ? setStep(s => s - 1) : setView('dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
              {step > 0 ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </button>
            <span className="font-bold text-slate-200 text-lg">
              {step === 0 ? 'Profesional' : step === 1 ? 'Servicios' : step === 2 ? 'Tiempos' : 'Pago'}
            </span>
          </div>
          
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i <= step ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 w-8' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 scrollbar-hide">
          
          {/* PASO 0: SELECCIÓN EMPLEADO */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {EMPLOYEES.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => { setSelectedEmp(emp); setStep(1); }}
                  className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group ${
                    selectedEmp?.id === emp.id 
                    ? 'bg-violet-600/20 border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.3)]' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110 ${emp.color} bg-opacity-20`}>
                    {emp.avatar}
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg leading-none mb-1">{emp.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{emp.role}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* PASO 1: SERVICIOS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="flex items-center justify-between px-1">
                <span className="text-slate-400 text-sm font-medium">Selecciona los servicios</span>
                {selectedServices.length > 0 && (
                  <span className="text-violet-400 font-bold bg-violet-400/10 px-3 py-1 rounded-full text-sm">
                    {formatCurrency(currentFinancials.total)}
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                {SERVICES.map(srv => {
                  const isSelected = selectedServices.some(s => s.id === srv.id);
                  return (
                    <button
                      key={srv.id}
                      onClick={() => toggleService(srv)}
                      className={`w-full p-4 rounded-2xl border flex justify-between items-center transition-all duration-200 ${
                        isSelected 
                        ? 'bg-violet-900/20 border-violet-500 shadow-md translate-x-1' 
                        : 'bg-slate-900 border-slate-800 active:scale-[0.98]'
                      }`}
                    >
                      <div className="text-left flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full ${isSelected ? 'bg-violet-500' : 'bg-slate-700'}`} />
                        <div>
                          <div className="font-bold text-white">{srv.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{srv.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-200">{formatCurrency(srv.price)}</div>
                        {srv.specialCommission && (
                          <div className="text-[10px] text-orange-400 font-bold bg-orange-400/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                             {srv.specialCommission * 100}% COM
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* PASO 2: TIEMPOS */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm space-y-8">
                  <div className="space-y-3">
                    <label className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-400" /> Check-in
                    </label>
                    <input 
                      type="time" 
                      value={timeData.checkIn}
                      onChange={(e) => setTimeData(prev => ({...prev, checkIn: e.target.value}))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-5 text-3xl font-mono text-center focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="h-px bg-slate-800 w-full" />

                  <div className="space-y-3">
                    <label className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-fuchsia-400" /> Check-out
                    </label>
                    <input 
                      type="time" 
                      value={timeData.checkOut}
                      onChange={(e) => setTimeData(prev => ({...prev, checkOut: e.target.value}))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-5 text-3xl font-mono text-center focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 focus:outline-none transition-all"
                    />
                  </div>
               </div>
               
               <p className="text-center text-slate-500 text-xs mt-6">
                 Los tiempos se usan para calcular la eficiencia por hora.
               </p>
            </div>
          )}

          {/* PASO 3: RESUMEN Y PAGO */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 pb-8">
               
               {/* Resumen Card */}
               <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Scissors className="w-32 h-32" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                     <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-3xl border border-slate-800">
                       {selectedEmp?.avatar}
                     </div>
                     <div>
                       <div className="font-bold text-xl text-white">{selectedEmp?.name}</div>
                       <div className="text-slate-400 text-sm">{selectedServices.length} servicios realizados</div>
                     </div>
                  </div>

                  <div className="space-y-4 relative z-10 bg-slate-950/30 p-4 rounded-2xl border border-slate-700/50">
                     <div className="flex justify-between items-end">
                        <span className="text-slate-400 text-sm font-medium">Facturación</span>
                        <span className="text-3xl font-black text-white tracking-tight">{formatCurrency(currentFinancials.total)}</span>
                     </div>
                     
                     <div className="h-px bg-slate-700/50 w-full dashed" />
                     
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Comisión ({Math.round((currentFinancials.commission / currentFinancials.total) * 100)}%)
                        </span>
                        <span className="text-orange-300 font-mono">- {formatCurrency(currentFinancials.commission)}</span>
                     </div>
                     
                     <div className="flex justify-between items-center text-sm pt-1">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase text-xs tracking-wider">
                          <TrendingUp className="w-3.5 h-3.5" /> Margen Salón
                        </span>
                        <span className="text-emerald-400 font-bold font-mono text-lg">
                          {formatCurrency(currentFinancials.margin)}
                        </span>
                     </div>
                  </div>
               </div>

               <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-1 mb-4">Método de Cobro</h3>

               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handlePayment('Efectivo')} className="h-20 bg-slate-900 hover:bg-emerald-900/20 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group">
                     <Banknote className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                     <span className="text-sm font-bold text-slate-300 group-hover:text-emerald-300">Efectivo</span>
                  </button>
                  <button onClick={() => handlePayment('QR')} className="h-20 bg-slate-900 hover:bg-blue-900/20 border border-slate-800 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group">
                     <QrCode className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                     <span className="text-sm font-bold text-slate-300 group-hover:text-blue-300">QR / Transferencia</span>
                  </button>
                  <button onClick={() => handlePayment('Débito')} className="h-20 bg-slate-900 hover:bg-violet-900/20 border border-slate-800 hover:border-violet-500/50 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group">
                     <CreditCard className="w-6 h-6 text-violet-400 group-hover:scale-110 transition-transform" />
                     <span className="text-sm font-bold text-slate-300 group-hover:text-violet-300">Débito</span>
                  </button>
                  <button onClick={() => handlePayment('Crédito')} className="h-20 bg-slate-900 hover:bg-orange-900/20 border border-slate-800 hover:border-orange-500/50 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group">
                     <CreditCard className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                     <span className="text-sm font-bold text-slate-300 group-hover:text-orange-300">Crédito</span>
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* FOOTER FLOTANTE (BOTÓN SIGUIENTE) - ARREGLADO CON Z-INDEX */}
        {view === 'checkout' && step < 3 && (
          <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent fixed bottom-0 w-full max-w-md z-50 left-1/2 -translate-x-1/2 pb-8">
            <button 
              disabled={
                (step === 0 && !selectedEmp) || 
                (step === 1 && selectedServices.length === 0) ||
                (step === 2 && (!timeData.checkIn || !timeData.checkOut))
              }
              onClick={() => setStep(prev => prev + 1)}
              className="w-full h-14 bg-white text-slate-950 font-black tracking-wide rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 active:scale-[0.98] transition-all shadow-xl shadow-white/5"
            >
              SIGUIENTE <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}