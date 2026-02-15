
import React from 'react';
import { Header } from './components/Header';
import { OperatorDashboard } from './views/OperatorDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { Shield, Users, Activity, LogOut, X, Loader2, MonitorX, WifiOff, CloudOff, Swords, Target, Crosshair } from 'lucide-react';
import { INITIAL_OPERATION, getRankByScore, ARMY_CONFIG } from './constants';
import { OperationEvent, MissionStatus, Operator, Mission, MissionProgress, ArmyType } from './types';
import { TacticalButton } from './components/TacticalButton';
import { db, auth } from './firebase';
import { signInAnonymously } from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";

const getDeviceId = () => {
  let id = localStorage.getItem('COMANDOS_DEVICE_ID');
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem('COMANDOS_DEVICE_ID', id);
  }
  return id;
};

const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
};

const LOCAL_STORAGE_OP_KEY = 'COMANDOS_LOCAL_OPERATION';
const LOCAL_STORAGE_RANKING_KEY = 'COMANDOS_LOCAL_RANKING';

const App: React.FC = () => {
  const [view, setView] = React.useState<'operator' | 'admin' | 'auth' | 'army_selection'>('auth');
  const [userInput, setUserInput] = React.useState('');
  const [callsign, setCallsign] = React.useState('');
  const [operation, setOperation] = React.useState<OperationEvent>(INITIAL_OPERATION);
  const [ranking, setRanking] = React.useState<Operator[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(true);
  const [isLocalMode, setIsLocalMode] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);

  const currentOperator = ranking.find(op => op.id === callsign);
  const deviceId = getDeviceId();

  React.useEffect(() => {
    const localOp = localStorage.getItem(LOCAL_STORAGE_OP_KEY);
    const localRanking = localStorage.getItem(LOCAL_STORAGE_RANKING_KEY);
    if (localOp) setOperation(JSON.parse(localOp));
    if (localRanking) setRanking(JSON.parse(localRanking));
  }, []);

  React.useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_OP_KEY, JSON.stringify(operation));
    localStorage.setItem(LOCAL_STORAGE_RANKING_KEY, JSON.stringify(ranking));
  }, [operation, ranking]);

  React.useEffect(() => {
    let unsubOp = () => {};
    let unsubRanking = () => {};

    const setupSync = async () => {
      try {
        setIsSyncing(true);
        // Autenticação anônima obrigatória para acesso às regras do Firestore
        await signInAnonymously(auth);
        
        unsubOp = onSnapshot(doc(db, "operations", "op-001"), (docSnap: any) => {
          if (docSnap.exists()) {
            setOperation(docSnap.data() as OperationEvent);
          } else {
            setDoc(doc(db, "operations", "op-001"), cleanData(INITIAL_OPERATION));
          }
          setIsSyncing(false);
          setIsLocalMode(false);
        }, (err: any) => {
          console.error("Op Sync Error:", err);
          setIsLocalMode(true);
          setIsSyncing(false);
        });

        unsubRanking = onSnapshot(collection(db, "ranking"), (snap: any) => {
          const ops: Operator[] = [];
          snap.forEach((d: any) => ops.push(d.data() as Operator));
          setRanking(ops);
        }, (err: any) => {
          console.error("Ranking Sync Error:", err);
          setIsLocalMode(true);
        });

      } catch (e) {
        console.error("Firebase Setup Error:", e);
        setIsLocalMode(true);
        setIsSyncing(false);
      }
    };

    setupSync();
    return () => { unsubOp(); unsubRanking(); };
  }, []);

  const handleUpdateOperation = async (op: Partial<OperationEvent>) => {
    const updated = { ...operation, ...op };
    setOperation(updated);
    if (!isLocalMode) {
      try {
        await updateDoc(doc(db, "operations", "op-001"), cleanData(op));
      } catch (err) { console.warn("Sync failed."); }
    }
  };

  const handleResetMatch = async () => {
    if (!window.confirm("PROTOCOLOS DE COMANDO: CONFIRMAR REINICIALIZAÇÃO?")) return;
    if (isLocalMode) {
      setRanking([]);
      setOperation({ ...operation, isActive: true });
      return;
    }
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, "operations", "op-001"), { isActive: true });
      const batch = writeBatch(db);
      ranking.forEach(op => batch.delete(doc(db, "ranking", op.id)));
      await batch.commit();
    } catch (err) { alert("FALHA CRÍTICA NO RESET."); } finally { setIsSyncing(false); }
  };

  const updateOperatorLocal = (id: string, updates: Partial<Operator>) => {
    setRanking(prev => prev.map(op => op.id === id ? { ...op, ...updates } : op));
  };

  const handleOperatorLogin = async () => {
    const trimmedInput = userInput.trim().toUpperCase();
    if (!trimmedInput) return;
    setLoginError(null);

    const existing = ranking.find(op => op.id === trimmedInput);
    
    if (existing) {
      if (existing.deviceId && existing.deviceId !== deviceId) {
        setLoginError("TERMINAL BLOQUEADO: CALLSIGN VINCULADO.");
        return;
      }
      setCallsign(trimmedInput);
      setView('operator');
      if (!isLocalMode) updateDoc(doc(db, "ranking", trimmedInput), { status: 'ONLINE' });
    } else {
      setCallsign(trimmedInput);
      setView('army_selection');
    }
  };

  const handleSelectArmy = async (army: ArmyType) => {
    const newOp: Operator = { 
      id: callsign, 
      callsign: callsign, 
      rank: getRankByScore(0), 
      score: 0, 
      status: 'ONLINE',
      deviceId: deviceId,
      army: army,
      missionsProgress: {} 
    };

    setRanking(prev => [...prev, newOp]);
    setView('operator');

    if (!isLocalMode) {
      try {
        await setDoc(doc(db, "ranking", callsign), cleanData(newOp));
      } catch (err) { setIsLocalMode(true); }
    }
  };

  const validateAdminPassword = () => {
    if (adminPassword === 'admin123') { setView('admin'); setShowPasswordModal(false); }
    else { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000); }
  };

  if (isSyncing && view === 'auth') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-amber">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-orbitron text-[10px] tracking-[0.4em] animate-pulse uppercase">Sincronizando Link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl bg-black">
      <Header />
      
      {isLocalMode && view !== 'auth' && (
        <div className="bg-red-600/10 border-b border-red-600/30 p-2 flex items-center justify-center gap-3">
          <CloudOff size={14} className="text-red-500 animate-pulse" />
          <p className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Link Tático Local</p>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {view === 'auth' ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-10">
            <div className="text-center space-y-4">
              <Shield className="w-20 h-20 text-amber mx-auto animate-pulse" />
              <h1 className="font-orbitron text-5xl font-black tracking-tighter amber-glow italic uppercase">COMANDOS</h1>
              <p className="text-[10px] opacity-40 uppercase tracking-[0.3em]">Tactical Field Management v4.2</p>
            </div>
            
            <div className="w-full max-w-xs space-y-6">
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="CALLSIGN" className={`w-full bg-black/40 military-border p-5 text-center text-amber font-mono text-xl uppercase focus:outline-none ${loginError ? 'border-red-600' : ''}`} onKeyDown={(e) => e.key === 'Enter' && handleOperatorLogin()}/>
              {loginError && <p className="text-red-500 text-[10px] font-black text-center uppercase">{loginError}</p>}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleOperatorLogin} className="military-border p-6 flex flex-col items-center gap-3 bg-amber/5 hover:bg-amber/10">
                  <Users size={36} className="text-amber" />
                  <span className="font-orbitron font-black text-[10px] uppercase">Operador</span>
                </button>
                <button onClick={() => setShowPasswordModal(true)} className="military-border p-6 flex flex-col items-center gap-3 bg-amber/5 hover:bg-amber/10">
                  <Activity size={36} className="text-amber" />
                  <span className="font-orbitron font-black text-[10px] uppercase">Admin</span>
                </button>
              </div>
            </div>
          </div>
        ) : view === 'army_selection' ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
            <div className="text-center">
              <h2 className="font-orbitron text-2xl font-black text-amber mb-2 uppercase">ALISTAMENTO TÁTICO</h2>
              <p className="text-[10px] opacity-60 uppercase tracking-widest">Selecione seu exército para esta operação</p>
            </div>
            
            <div className="w-full space-y-4">
              {(Object.entries(ARMY_CONFIG) as [ArmyType, any][]).map(([type, config]) => (
                <button 
                  key={type}
                  onClick={() => handleSelectArmy(type)}
                  style={{ borderColor: `${config.color}44`, backgroundColor: `${config.color}11` }}
                  className="w-full military-border p-5 flex items-center gap-5 group hover:bg-white/5 transition-all text-left"
                >
                  <div className="p-3 military-border" style={{ borderColor: config.color, color: config.color }}>
                    {type === 'ALIADO' && <Shield size={24} />}
                    {type === 'INVASOR' && <Swords size={24} />}
                    {type === 'MERCENARIO' && <Target size={24} />}
                  </div>
                  <div>
                    <h3 className="font-orbitron font-black text-lg" style={{ color: config.color }}>{config.label}</h3>
                    <p className="text-[10px] text-white/40 uppercase font-mono">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : view === 'operator' ? (
          <OperatorDashboard 
            operatorCallsign={callsign} 
            operation={operation} 
            ranking={ranking}
            missionsProgress={currentOperator?.missionsProgress || {}}
            onCompleteMission={async (id) => {
              const m = operation.missions.find(x => x.id === id);
              if (!m) return;
              const newScore = (currentOperator?.score || 0) + m.points;
              const newProgress = { ...currentOperator?.missionsProgress, [id]: { status: MissionStatus.COMPLETED } };
              updateOperatorLocal(callsign, { score: newScore, rank: getRankByScore(newScore), missionsProgress: newProgress });
              if (!isLocalMode) updateDoc(doc(db, "ranking", callsign), cleanData({ score: newScore, rank: getRankByScore(newScore), missionsProgress: newProgress }));
            }} 
            onStartMission={(id) => {
              const newProgress = { ...currentOperator?.missionsProgress, [id]: { status: MissionStatus.IN_PROGRESS, startedAt: Date.now() } };
              updateOperatorLocal(callsign, { missionsProgress: newProgress });
              if (!isLocalMode) updateDoc(doc(db, "ranking", callsign), cleanData({ missionsProgress: newProgress }));
            }} 
            onFailMission={(id) => {
              const newProgress = { ...currentOperator?.missionsProgress, [id]: { status: MissionStatus.FAILED } };
              updateOperatorLocal(callsign, { missionsProgress: newProgress });
              if (!isLocalMode) updateDoc(doc(db, "ranking", callsign), cleanData({ missionsProgress: newProgress }));
            }}
          />
        ) : (
          <AdminDashboard 
            operation={operation} ranking={ranking} 
            onUpdateOperation={handleUpdateOperation}
            onResetMatch={handleResetMatch}
            onUpdateScore={(id, delta) => {
               const op = ranking.find(o => o.id === id);
               if(op) {
                 const ns = Math.max(0, op.score + delta);
                 updateOperatorLocal(id, { score: ns, rank: getRankByScore(ns) });
                 if (!isLocalMode) updateDoc(doc(db, "ranking", id), cleanData({ score: ns, rank: getRankByScore(ns) }));
               }
            }}
            onRemoveOperator={(id) => {
              setRanking(prev => prev.filter(o => o.id !== id));
              if (!isLocalMode) deleteDoc(doc(db, "ranking", id));
            }} 
            onSaveMission={(m) => {
              const exists = m.id ? operation.missions.find(x => x.id === m.id) : null;
              const newMissions = exists 
                ? operation.missions.map(x => x.id === m.id ? { ...x, ...m, updatedAt: Date.now() } : x)
                : [...operation.missions, { ...m, id: `m-${Date.now()}`, updatedAt: Date.now(), armies: m.armies || [] } as Mission];
              handleUpdateOperation({ missions: cleanData(newMissions) });
            }} 
            onDeleteMission={(id) => handleUpdateOperation({ missions: operation.missions.filter(m => m.id !== id && m.parentId !== id) })}
          />
        )}
      </main>

      {view !== 'auth' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-amber/40 z-50 p-2 max-w-md mx-auto flex justify-between items-center px-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLocalMode ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
            <span className="text-[8px] font-black uppercase text-amber/60">{isLocalMode ? 'Local Link' : 'HQ Sync'}</span>
          </div>
          <button onClick={() => setView('auth')} className="flex flex-col items-center gap-1 text-amber/40 hover:text-red-500 transition-colors">
            <LogOut size={22} />
            <span className="text-[8px] font-black uppercase">Sair</span>
          </button>
        </nav>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className={`w-full max-sm military-border bg-black p-6 space-y-6 ${passwordError ? 'shake border-red-600' : 'border-amber'}`}>
            <h3 className="font-orbitron text-amber font-black uppercase tracking-widest">Chave de Acesso</h3>
            <input type="password" autoFocus value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && validateAdminPassword()} placeholder="SENHA" className="w-full bg-black/60 border border-amber/30 p-4 text-center text-amber font-mono text-xl uppercase focus:outline-none"/>
            <TacticalButton label="AUTENTICAR" onClick={validateAdminPassword} className="w-full py-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
