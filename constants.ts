
import { OperationEvent, MissionStatus, Operator, ArmyType } from './types';

export const COLORS = {
  amber: '#ffb000',
  amberDim: 'rgba(255, 176, 0, 0.2)',
  danger: '#ff4444',
  success: '#00ff44',
  aliado: '#3b82f6',
  invasor: '#ef4444',
  mercenario: '#eab308'
};

export const ARMY_CONFIG: Record<ArmyType, { label: string; color: string; description: string }> = {
  ALIADO: { label: 'ALIADO', color: COLORS.aliado, description: 'Forças de Defesa e Estabilização.' },
  INVASOR: { label: 'INVASOR', color: COLORS.invasor, description: 'Unidades de Assalto e Infiltração.' },
  MERCENARIO: { label: 'MERCENÁRIO', color: COLORS.mercenario, description: 'Especialistas em busca de lucro.' }
};

export const getRankByScore = (score: number): string => {
  if (score >= 4000) return 'MARECHAL';
  if (score >= 3500) return 'GENERAL';
  if (score >= 3000) return 'CORONEL';
  if (score >= 2500) return 'MAJOR';
  if (score >= 2000) return 'CAPITÃO';
  if (score >= 1500) return 'TENENTE';
  if (score >= 1000) return 'ASPIRANTE';
  if (score >= 800) return 'SUB-TENENTE';
  if (score >= 600) return 'SARGENTO';
  if (score >= 400) return 'CABO';
  if (score >= 200) return 'SOLDADO';
  return 'RECRUTA';
};

export const INITIAL_OPERATION: OperationEvent = {
  id: 'op-001',
  name: 'CHERNOBYL RECOVERY',
  date: '2026-04-19',
  description: 'RECUPERAÇÃO DE ATIVOS EM ZONA HOSTIL.',
  mapUrl: 'https://images.unsplash.com/photo-1526370417036-39e44686985d?auto=format&fit=crop&q=80&w=1200',
  isActive: true,
  missions: [
    {
      id: 'm-01',
      title: 'PERÍMETRO ALPHA',
      briefing: 'Garanta a segurança do setor Leste para a chegada do comboio. Elimine resistência.',
      points: 500,
      isMain: true,
      status: MissionStatus.ACTIVE,
      location: { lat: -23.5505, lng: -46.6333, label: 'SETOR LESTE' },
      code: 'ALPHA-9',
      updatedAt: Date.now(),
      armies: ['ALIADO', 'INVASOR', 'MERCENARIO']
    },
    {
      id: 'm-02',
      title: 'RECUPERAR INTEL',
      briefing: 'Localize o rádio abandonado na casa em ruínas (Ponto Beta).',
      points: 250,
      isMain: false,
      status: MissionStatus.ACTIVE,
      code: 'BETA-VIX',
      updatedAt: Date.now(),
      parentId: 'm-01',
      armies: ['ALIADO', 'MERCENARIO']
    },
    {
      id: 'm-03',
      title: 'EXTRAÇÃO SEGURA',
      briefing: 'Prepare a LZ para o helicóptero de extração no Setor Norte.',
      points: 400,
      isMain: true,
      status: MissionStatus.LOCKED,
      code: 'EXIT-7',
      updatedAt: Date.now(),
      armies: ['ALIADO']
    }
  ]
};
