
import * as React from 'react';
import { Target, Map as MapIcon, Trophy, FileText, QrCode, CheckCircle2, Radio, Info, ShieldCheck, X, ListTree, Timer, Play, AlertTriangle, Lock, Plus, Minus, Award, Zap, Swords, Clock, ChevronRight, MapPin, ZoomIn, ZoomOut, Maximize, Crosshair } from 'lucide-react';
import { TacticalButton } from '../components/TacticalButton';
import { QRScanner } from '../components/QRScanner';
import { OperationEvent, Mission, MissionStatus, Operator, MissionProgress, ArmyType } from '../types';
import { ARMY_CONFIG } from '../constants';

interface OperatorDashboardProps {
  operatorCallsign: string;
  operation: OperationEvent;
  ranking: Operator[];
  missionsProgress: Record<string, MissionProgress>;
  onCompleteMission: (missionId: string) => void;
  onStartMission: (missionId: string) => void;
  onFailMission: (missionId: string) => void;
}

const MissionTimer: React.FC<{ startedAt: number; durationMinutes: number }> = ({ startedAt, durationMinutes }) => {
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  
  React.useEffect(() => {
    const updateTimer = () => {
      const durationMs = durationMinutes * 60 * 1000;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMinutes]);

  const totalMs = durationMinutes * 60 * 1000;
  const percentage = (timeLeft / totalMs) * 100;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-amber/60 uppercase flex items-center gap-1">
          <Clock size={10} className={timeLeft < 60000 ? 'text-red-500 animate-pulse' : ''} /> 
          Tempo de Execução
        </span>
        <span className={`font-mono text-sm font-bold ${timeLeft < 60000 ? 'text-red-500' : 'text-amber'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      <div className="h-1 bg-white/10 w-full rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${timeLeft < 60000 ? 'bg-red-600' : 'bg-amber'}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ 
  operatorCallsign, 
  operation, 
  ranking,
  missionsProgress,
  onCompleteMission,
  onStartMission,
  onFailMission
}) => {
  const [activeTab, setActiveTab] = React.useState<'briefing' | 'map' | 'ranking'>('briefing');
  const [scanning, setScanning] = React.useState(false);
  const [validatingMission, setValidatingMission] = React.useState<Mission | null>(null);
  const [detailMission, setDetailMission] = React.useState<Mission | null>(null);
  const [manualCode, setManualCode] = React.useState('');
  const [validationStatus, setValidationStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  
  // Estados para Navegação do Mapa
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [lastPos, setLastPos] = React.useState({ x: 0, y: 0 });

  const operator = ranking.find(op => op.id === operatorCallsign);
  const armyConfig = operator ? ARMY_CONFIG[operator.army] : null;

  const operatorMissions = operation.missions.filter(m => 
    m.armies && m.armies.includes(operator?.army as ArmyType)
  );

  const primaryMissions = operatorMissions.filter(m => m.isMain);

  const handleValidate = (code: string) => {
    if (!validatingMission) return;
    if (code.toUpperCase() === validatingMission.code.toUpperCase()) {
      setValidationStatus('success');
      setTimeout(() => {
        onCompleteMission(validatingMission.id);
        setValidatingMission(null);
        setManualCode('');
        setScanning(false);
        setValidationStatus('idle');
      }, 1500);
    } else {
      setValidationStatus('error');
      setTimeout(() => setValidationStatus('idle'), 2000);
    }
  };

  // Funções de Mapa
  const resetMap = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };
  const adjustZoom = (delta: number) => setZoom(prev => Math.min(Math.max(prev + delta, 1), 5));

  const handleStart = (e: any) => {
    setIsDragging(true);
    const pos = e.touches ? e.touches[0] : e;
    setLastPos({ x: pos.clientX, y: pos.clientY });
  };

  const handleMove = (e: any) => {
    if (!isDragging) return;
    const pos = e.touches ? e.touches[0] : e;
    const dx = pos.clientX - lastPos.x;
    const dy = pos.clientY - lastPos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: pos.clientX, y: pos.clientY });
  };

  const handleEnd = () => setIsDragging(false);

  return (
    <div className="pb-24 pt-2">
      <div className="mx-4 p-3 military-border bg-black mb-4 relative overflow-hidden" style={{ borderColor: armyConfig?.color + '44' }}>
        <div className="absolute right-0 top-0 h-full w-24 opacity-10 pointer-events-none flex items-center justify-center">
           {operator?.army === 'ALIADO' && <ShieldCheck size={80} />}
           {operator?.army === 'INVASOR' && <Swords size={80} />}
           {operator?.army === 'MERCENARIO' && <Target size={80} />}
        </div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-[8px] font-black uppercase tracking-tighter" style={{ color: armyConfig?.color }}>EXÉRCITO {armyConfig?.label}</p>
            <h2 className="font-orbitron text-sm font-black text-white leading-tight uppercase">{operation.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-[8px] opacity-40 uppercase font-black leading-none mb-1">Operador</p>
            <p className="font-orbitron font-bold text-amber amber-glow uppercase text-sm">{operatorCallsign}</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="grid grid-cols-3 gap-1 bg-black p-1 military-border">
          <button onClick={() => setActiveTab('briefing')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'briefing' ? 'bg-amber text-black' : 'text-amber/40'}`}>
            <FileText size={18} /><span className="text-[9px] font-black uppercase">Briefing</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'bg-amber text-black' : 'text-amber/40'}`}>
            <MapIcon size={18} /><span className="text-[9px] font-black uppercase">Mapa</span>
          </button>
          <button onClick={() => setActiveTab('ranking')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'bg-amber text-black' : 'text-amber/40'}`}>
            <Trophy size={18} /><span className="text-[9px] font-black uppercase">Ranking</span>
          </button>
        </div>

        <div>
          {activeTab === 'briefing' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-amber pl-2 py-1">
                <Radio size={16} /><h3 className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase">Objetivos da Facção</h3>
              </div>
              <div className="space-y-3">
                {primaryMissions.map(mission => {
                  const prog = missionsProgress[mission.id] || { status: MissionStatus.ACTIVE };
                  return (
                    <div key={mission.id} className={`military-border overflow-hidden transition-all duration-300 ${prog.status === MissionStatus.COMPLETED ? 'bg-green-950/5 border-green-900/40' : 'bg-black/40'}`}>
                      <button onClick={() => setDetailMission(mission)} className="w-full flex items-center justify-between p-4 text-left hover:bg-amber/5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 border ${prog.status === MissionStatus.COMPLETED ? 'border-green-500 text-green-500' : 'border-amber/50 text-amber'}`}>
                            {prog.status === MissionStatus.COMPLETED ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[8px] px-1 py-0.5 font-black bg-amber text-black uppercase">PRIMÁRIA</span>
                              <span className="text-[10px] font-mono font-bold text-amber/60">+{mission.points} PTS</span>
                            </div>
                            <h4 className="font-black uppercase text-sm">{mission.title}</h4>
                          </div>
                        </div>
                        <Info size={20} className="text-amber/40" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-l-4 border-amber pl-2 py-1 mb-2">
                <div className="flex items-center gap-2">
                  <Crosshair size={16} className="text-amber animate-pulse" />
                  <h3 className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase">Sinal de Satélite</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => adjustZoom(0.5)} className="p-1 military-border bg-black text-amber"><ZoomIn size={14}/></button>
                  <button onClick={() => adjustZoom(-0.5)} className="p-1 military-border bg-black text-amber"><ZoomOut size={14}/></button>
                  <button onClick={resetMap} className="p-1 military-border bg-black text-amber"><Maximize size={14}/></button>
                </div>
              </div>

              <div 
                className="military-border bg-black relative aspect-[4/5] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              >
                <div 
                  className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform flex items-center justify-center"
                  style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
                >
                  {operation.mapUrl ? (
                    <img 
                      src={operation.mapUrl} 
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none" 
                      style={{ filter: 'sepia(0.3) brightness(0.7) contrast(1.1) grayscale(0.5)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-amber/10">
                      <AlertTriangle size={48} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Aguardando Feed de Satélite</span>
                    </div>
                  )}
                </div>

                {/* HUD Dinâmico */}
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start opacity-60">
                    <div className="font-mono text-[8px] bg-black/80 p-1 border border-amber/20">
                      LAT: {(23.55 + (offset.y / 10000)).toFixed(5)}<br/>
                      LNG: {(-46.63 + (offset.x / 10000)).toFixed(5)}
                    </div>
                    <div className="font-mono text-[8px] bg-black/80 p-1 border border-amber/20">
                      MAG: {zoom.toFixed(1)}x<br/>
                      ENC: AES-256
                    </div>
                  </div>
                  
                  {/* Bússola Decorativa */}
                  <div className="absolute right-4 bottom-16 opacity-30">
                     <div className="relative w-12 h-12 border border-amber rounded-full flex items-center justify-center">
                        <div className="absolute top-0 font-black text-[8px] text-amber">N</div>
                        <div className="w-px h-10 bg-amber/50 rotate-45"></div>
                        <div className="w-px h-10 bg-amber/50 -rotate-45"></div>
                     </div>
                  </div>

                  <div className="flex justify-center opacity-40">
                     <div className="w-32 h-px bg-amber/30 relative">
                        <div className="absolute -top-1 left-0 w-px h-2 bg-amber"></div>
                        <div className="absolute -top-1 right-0 w-px h-2 bg-amber"></div>
                        <div className="absolute -top-4 w-full text-center text-[7px] font-black">ESCALA: 50m</div>
                     </div>
                  </div>
                </div>

                {/* Efeito de Scanner */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-amber/[0.03] to-transparent h-20 animate-scanline"></div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                <p className="text-[8px] text-amber/40 uppercase font-black tracking-widest">
                  Transmissão ao Vivo • {new Date().toLocaleTimeString()} • HQ LINK STABLE
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="space-y-3">
               <div className="text-center py-2 bg-amber/5 military-border mb-2">
                 <p className="text-[9px] font-black text-amber uppercase tracking-widest">Visualização Global de Performance</p>
               </div>
              {ranking.sort((a,b) => b.score - a.score).map((op, idx) => (
                <div key={op.id} className={`flex items-center justify-between p-4 military-border ${op.id === operatorCallsign ? 'bg-amber/10 border-amber' : 'bg-black/60'}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-orbitron text-amber/40 font-black text-xs">{idx + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ARMY_CONFIG[op.army].color }}></div>
                         <div className="font-black text-white text-sm uppercase">{op.callsign}</div>
                      </div>
                      <div className="text-[8px] opacity-40 font-bold uppercase">{ARMY_CONFIG[op.army].label} | {op.rank}</div>
                    </div>
                  </div>
                  <div className="text-amber font-mono font-bold text-md">{op.score}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detailMission && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md military-border bg-[#0a0a0a] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-amber/20 bg-amber/5 flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-orbitron font-black text-lg text-white uppercase">{detailMission.title}</h3>
                <span className="text-[8px] font-black text-amber/60 uppercase">OBJETIVO TÁTICO: [REQUER RECONHECIMENTO]</span>
              </div>
              <button onClick={() => setDetailMission(null)} className="p-2 text-amber/40 hover:text-amber ml-2"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Timer HUD */}
              {missionsProgress[detailMission.id]?.status === MissionStatus.IN_PROGRESS && detailMission.timerMinutes && detailMission.timerMinutes > 0 && (
                <div className="bg-amber/5 p-3 military-border">
                  <MissionTimer 
                    startedAt={missionsProgress[detailMission.id].startedAt || Date.now()} 
                    durationMinutes={detailMission.timerMinutes} 
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[12px] leading-relaxed text-amber/90 font-mono italic bg-white/5 p-4 border-l-2 border-amber/30">{detailMission.briefing}</p>
              </div>

              {/* Objetivos Secundários */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-amber/10 pb-1">
                   <ListTree size={14} className="text-amber/40"/>
                   <span className="text-[9px] font-black text-amber/40 uppercase">Sub-objetivos Disponíveis</span>
                </div>
                {operation.missions.filter(m => m.parentId === detailMission.id).map(sub => {
                  const subProg = missionsProgress[sub.id] || { status: MissionStatus.ACTIVE };
                  return (
                    <div key={sub.id} className={`military-border p-3 flex justify-between items-center transition-all ${subProg.status === MissionStatus.COMPLETED ? 'bg-green-950/20 border-green-500/30' : 'bg-black'}`}>
                      <div>
                        <h5 className="font-black text-[11px] text-white uppercase">{sub.title}</h5>
                        <p className="text-[8px] text-amber/40 uppercase font-mono italic">{sub.briefing.substring(0, 40)}...</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono font-bold text-amber">+{sub.points} PTS</span>
                        <button 
                          onClick={() => setDetailMission(sub)}
                          className="p-1 text-amber/40 hover:text-amber"
                        >
                          <ChevronRight size={16}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="military-border p-3 bg-amber/5 text-center">
                  <Award size={20} className="text-amber mx-auto mb-1" />
                  <span className="font-orbitron font-black text-xl text-amber">+{detailMission.points}</span>
                  <p className="text-[7px] font-black opacity-40 uppercase">Valor Recompensa</p>
                </div>
                <div className="military-border p-3 bg-amber/5 text-center">
                  <Zap size={20} className="text-amber mx-auto mb-1" />
                  <span className="font-orbitron font-black text-[10px] text-amber uppercase">{missionsProgress[detailMission.id]?.status || 'DISPONÍVEL'}</span>
                  <p className="text-[7px] font-black opacity-40 uppercase">Status Atual</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black border-t border-amber/20 flex gap-3">
              {(!missionsProgress[detailMission.id] || missionsProgress[detailMission.id].status === MissionStatus.ACTIVE) && (
                <TacticalButton label="INICIAR MISSÃO" icon={<Play size={18} />} className="flex-1 py-4" onClick={() => onStartMission(detailMission.id)} />
              )}
              {missionsProgress[detailMission.id]?.status === MissionStatus.IN_PROGRESS && (
                <TacticalButton label="VALIDAR ALVO" icon={<QrCode size={18} />} className="flex-1 py-4" onClick={() => { setValidatingMission(detailMission); setDetailMission(null); }} />
              )}
              {missionsProgress[detailMission.id]?.status === MissionStatus.COMPLETED && (
                <div className="w-full text-center py-2 bg-green-500/10 border border-green-500/30 text-green-500 font-black text-[10px] uppercase tracking-widest">
                  OBJETIVO CONCLUÍDO
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {validatingMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95">
          <div className={`w-full max-w-sm military-border bg-black p-6 space-y-6 ${validationStatus === 'error' ? 'border-red-600' : validationStatus === 'success' ? 'border-green-500' : 'border-amber'}`}>
            <div className="flex justify-between items-center"><h3 className="font-orbitron text-md font-black uppercase text-amber">VALIDAR ALVO</h3><button onClick={() => setValidatingMission(null)} className="text-amber/40"><X size={24} /></button></div>
            <p className="text-[10px] text-center font-bold text-amber/60 uppercase">Insira o código capturado no ponto de objetivo</p>
            <input type="text" autoFocus value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} className="w-full bg-black/60 border p-4 text-center text-2xl font-mono text-amber focus:outline-none border-amber/30" placeholder="CÓDIGO"/>
            <div className="grid grid-cols-1 gap-3">
              <TacticalButton label="CONFIRMAR PROTOCOLO" onClick={() => handleValidate(manualCode)} className="w-full py-4" />
              <div className="flex items-center gap-4">
                <div className="h-px bg-amber/20 flex-1"></div>
                <span className="text-[8px] font-black text-amber/40 uppercase">Ou use o Scanner</span>
                <div className="h-px bg-amber/20 flex-1"></div>
              </div>
              <TacticalButton label="ATIVAR SCANNER QR" variant="outline" icon={<QrCode size={18}/>} onClick={() => setScanning(true)} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {scanning && <QRScanner onResult={(res) => { setManualCode(res); handleValidate(res); setScanning(false); }} onClose={() => setScanning(false)} />}
    </div>
  );
};
