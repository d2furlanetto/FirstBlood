
import * as React from 'react';
import { Plus, PlusCircle, MinusCircle, Trash2, ShieldAlert, Award, RefreshCcw, Camera, MapPin, SlidersHorizontal, Lock, QrCode, Radio, Upload, ImageIcon, Users, UserMinus, Skull, MapIcon, Target, LayoutGrid, X, Edit3, Save, CheckCircle2, LinkIcon, ChevronRight, Info, Timer, Trophy, Shield, Swords, ListTree, Clock, ImagePlus } from 'lucide-react';
import { TacticalButton } from '../components/TacticalButton';
import { OperationEvent, Operator, MissionStatus, Mission, ArmyType } from '../types';
import { ARMY_CONFIG } from '../constants';

interface AdminDashboardProps {
  operation: OperationEvent;
  ranking: Operator[];
  onUpdateOperation: (op: Partial<OperationEvent>) => void;
  onResetMatch: () => void;
  onUpdateScore: (id: string, delta: number) => void;
  onRemoveOperator: (id: string) => void;
  onSaveMission: (mission: Partial<Mission>) => void;
  onDeleteMission: (missionId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  operation, ranking, onUpdateOperation, onResetMatch, onUpdateScore, onRemoveOperator, onSaveMission, onDeleteMission 
}) => {
  const [activeTab, setActiveTab] = React.useState<'missions' | 'map' | 'ranking'>('missions');
  const [editingMission, setEditingMission] = React.useState<Partial<Mission> | null>(null);
  const [selectedMissionQR, setSelectedMissionQR] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toggleArmyInMission = (army: ArmyType) => {
    if (!editingMission) return;
    const currentArmies = editingMission.armies || [];
    const newArmies = currentArmies.includes(army)
      ? currentArmies.filter(a => a !== army)
      : [...currentArmies, army];
    setEditingMission({ ...editingMission, armies: newArmies });
  };

  const handleMapUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // Limite de 1MB para Firestore base64
        alert("ARQUIVO MUITO GRANDE. LIMITE: 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateOperation({ mapUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const primaryMissions = operation.missions.filter(m => m.isMain);

  return (
    <div className="p-4 pb-32 flex flex-col space-y-6">
      <div className="flex justify-between items-center border-b border-amber/20 pb-4">
        <div>
          <h2 className="font-orbitron text-xl font-black text-amber flex items-center gap-2"><Lock size={18} className="text-red-600 animate-pulse" /> CMD CENTRAL</h2>
          <p className="text-[9px] opacity-40 uppercase font-black tracking-widest italic">Protocolos Administrativos</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-black p-1 military-border">
        <button onClick={() => setActiveTab('missions')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'missions' ? 'bg-amber text-black' : 'text-amber/40'}`}><LayoutGrid size={18} /><span className="text-[9px] font-black uppercase">Missões</span></button>
        <button onClick={() => setActiveTab('map')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'bg-amber text-black' : 'text-amber/40'}`}><MapIcon size={18} /><span className="text-[9px] font-black uppercase">Mapa</span></button>
        <button onClick={() => setActiveTab('ranking')} className={`py-3 flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'bg-amber text-black' : 'text-amber/40'}`}><Trophy size={18} /><span className="text-[9px] font-black uppercase">Ranking</span></button>
      </div>

      <div>
        {activeTab === 'missions' && (
          <div className="space-y-6">
            <div className="space-y-4">
              {primaryMissions.map(primary => (
                <div key={primary.id} className="military-border bg-amber/5 p-4 border-amber/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                       <div className="flex gap-1 mb-2">
                         {primary.armies?.map(a => (
                           <span key={a} className="text-[7px] font-black px-1 py-0.5 uppercase text-white" style={{ backgroundColor: ARMY_CONFIG[a].color }}>{a}</span>
                         ))}
                         {primary.timerMinutes && primary.timerMinutes > 0 && (
                           <span className="text-[7px] font-black px-1 py-0.5 uppercase bg-red-600 text-white flex items-center gap-1"><Clock size={8}/> {primary.timerMinutes} MIN</span>
                         )}
                       </div>
                       <h4 className="font-orbitron font-black text-white text-sm uppercase">{primary.title}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingMission(primary)} className="p-2 border border-amber/20 text-amber"><Edit3 size={14} /></button>
                      <button onClick={() => setSelectedMissionQR(primary.id)} className="p-2 border border-amber/20 text-amber"><QrCode size={16} /></button>
                      <button onClick={() => onDeleteMission(primary.id)} className="p-2 border border-red-900/40 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Lista de Secundárias */}
                  <div className="pl-4 border-l border-amber/20 space-y-2">
                    {operation.missions.filter(m => m.parentId === primary.id).map(sub => (
                      <div key={sub.id} className="flex justify-between items-center text-[10px] bg-black/40 p-2 military-border">
                        <span className="font-bold text-amber/80 uppercase"><ListTree size={10} className="inline mr-1"/> {sub.title}</span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingMission(sub)} className="text-amber/60"><Edit3 size={10} /></button>
                          <button onClick={() => onDeleteMission(sub.id)} className="text-red-900/60"><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setEditingMission({ title: '', briefing: '', points: 100, isMain: false, code: '', parentId: primary.id, armies: primary.armies })}
                      className="text-[9px] font-black text-amber/40 hover:text-amber uppercase flex items-center gap-1 mt-2"
                    >
                      <Plus size={12}/> Adicionar Objetivo Secundário
                    </button>
                  </div>
                </div>
              ))}
              <TacticalButton label="NOVA MISSÃO PRIMÁRIA" icon={<PlusCircle size={20}/>} className="w-full" onClick={() => setEditingMission({ title: '', briefing: '', points: 200, isMain: true, code: '', timerMinutes: 0, armies: ['ALIADO', 'INVASOR', 'MERCENARIO'] })} />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="military-border bg-black aspect-video relative overflow-hidden group">
              {operation.mapUrl ? (
                <img src={operation.mapUrl} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-amber/20 p-8 border-2 border-dashed border-amber/10">
                  <MapPin size={48} className="mb-2" />
                  <span className="text-[10px] font-black uppercase">Nenhum Mapa Carregado</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <p className="text-[10px] font-black text-amber uppercase tracking-widest">Visualização em Campo</p>
              </div>
            </div>

            <div className="space-y-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleMapUpload} 
                className="hidden" 
                accept="image/*"
              />
              <TacticalButton 
                label="CARREGAR NOVO MAPA" 
                icon={<ImagePlus size={18}/>} 
                className="w-full py-4" 
                onClick={() => fileInputRef.current?.click()}
              />
              <p className="text-[8px] text-amber/40 uppercase font-black text-center tracking-tighter">
                Recomendado: Formato Paisagem (16:9), máximo 1MB
              </p>
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-4">
            {ranking.sort((a,b) => b.score - a.score).map(op => (
              <div key={op.id} className="military-border bg-black/60 p-3 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ARMY_CONFIG[op.army].color }}></div>
                    <h4 className="font-black text-white text-xs uppercase">{op.callsign}</h4>
                  </div>
                  <p className="text-[8px] opacity-40 uppercase font-black">{ARMY_CONFIG[op.army].label} | {op.rank}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => onUpdateScore(op.id, 50)} className="text-green-500"><PlusCircle size={18}/></button>
                  <span className="font-mono text-amber font-black">{op.score}</span>
                  <button onClick={() => onUpdateScore(op.id, -50)} className="text-red-500"><MinusCircle size={18}/></button>
                  <button onClick={() => onRemoveOperator(op.id)} className="text-red-600/40 ml-2"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            <TacticalButton label="RESETAR TUDO" variant="danger" className="w-full py-4 mt-8" onClick={onResetMatch} icon={<RefreshCcw size={16}/>} />
          </div>
        )}
      </div>

      {editingMission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-md military-border bg-black p-6 space-y-6 max-h-[90vh] overflow-y-auto border-amber">
            <h3 className="font-orbitron text-amber font-black uppercase text-lg">
              {editingMission.isMain ? 'MISSÃO PRIMÁRIA' : 'OBJETIVO SECUNDÁRIO'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-amber/60 uppercase">Título da Missão</label>
                <input type="text" placeholder="TÍTULO" value={editingMission.title || ''} onChange={e => setEditingMission({...editingMission, title: e.target.value.toUpperCase()})} className="w-full bg-black military-border p-3 text-white text-xs uppercase focus:outline-none"/>
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-amber/60 uppercase">Instruções de Campo (Briefing)</label>
                <textarea placeholder="BRIEFING" rows={3} value={editingMission.briefing || ''} onChange={e => setEditingMission({...editingMission, briefing: e.target.value})} className="w-full bg-black military-border p-3 text-white text-[10px] uppercase focus:outline-none"/>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber uppercase">Alvos de Exército (Quem vê esta missão)</label>
                <div className="grid grid-cols-3 gap-2">
                   {(Object.entries(ARMY_CONFIG) as [ArmyType, any][]).map(([type, config]) => (
                     <button 
                       key={type}
                       type="button"
                       onClick={() => toggleArmyInMission(type)}
                       style={{ 
                         borderColor: editingMission.armies?.includes(type) ? config.color : 'rgba(255,255,255,0.1)',
                         backgroundColor: editingMission.armies?.includes(type) ? `${config.color}22` : 'transparent',
                         color: editingMission.armies?.includes(type) ? config.color : 'rgba(255,255,255,0.2)'
                       }}
                       className="p-2 border military-border text-[9px] font-black uppercase transition-all"
                     >
                        {config.label}
                     </button>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-amber/60 uppercase">Pontos</label>
                  <input type="number" placeholder="PTS" value={editingMission.points || 0} onChange={e => setEditingMission({...editingMission, points: parseInt(e.target.value) || 0})} className="w-full bg-black military-border p-3 text-amber font-mono text-xs"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-amber/60 uppercase">Código Alvo</label>
                  <input type="text" placeholder="QR" value={editingMission.code || ''} onChange={e => setEditingMission({...editingMission, code: e.target.value.toUpperCase()})} className="w-full bg-black military-border p-3 text-amber font-mono text-xs uppercase"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-amber/60 uppercase">Tempo (Min)</label>
                  <input type="number" placeholder="MIN" value={editingMission.timerMinutes || 0} onChange={e => setEditingMission({...editingMission, timerMinutes: parseInt(e.target.value) || 0})} className="w-full bg-black military-border p-3 text-amber font-mono text-xs"/>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <TacticalButton label="CANCELAR" variant="outline" className="flex-1" onClick={() => setEditingMission(null)} />
                <TacticalButton label="SALVAR PROTOCOLO" className="flex-1" onClick={() => { onSaveMission(editingMission); setEditingMission(null); }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMissionQR && (
         <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-6" onClick={() => setSelectedMissionQR(null)}>
            <div className="bg-white p-6 border-8 border-amber" onClick={e => e.stopPropagation()}>
               <div className="w-64 h-64 bg-black flex items-center justify-center p-4">
                  <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-0.5 bg-white">
                    {[...Array(100)].map((_, i) => (<div key={i} className={Math.random() > 0.5 ? 'bg-black' : 'bg-white'}></div>))}
                  </div>
               </div>
               <p className="text-black font-black text-center mt-4 font-mono uppercase text-lg">CODE: {operation.missions.find(m => m.id === selectedMissionQR)?.code}</p>
            </div>
         </div>
      )}
    </div>
  );
};
