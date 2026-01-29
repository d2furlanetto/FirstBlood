
import * as React from 'react';

// Centralized fix for JSX intrinsic element errors (div, span, button, etc.)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

export type ArmyType = 'ALIADO' | 'INVASOR' | 'MERCENARIO';

export enum MissionStatus {
  LOCKED = 'LOCKED',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Mission {
  id: string;
  title: string;
  briefing: string;
  points: number;
  isMain: boolean;
  location?: { lat: number; lng: number; label: string };
  code: string; 
  updatedAt: number;
  parentId?: string;
  timerMinutes?: number;
  status?: MissionStatus;
  armies: ArmyType[]; // Lista de exércitos que podem ver/fazer esta missão
}

export interface MissionProgress {
  status: MissionStatus;
  startedAt?: number;
}

export interface Operator {
  id: string;
  callsign: string;
  rank: string;
  score: number;
  status: 'ONLINE' | 'OFFLINE' | 'KIA';
  deviceId: string;
  army: ArmyType; // Facção do operador
  lastLat?: number;
  lastLng?: number;
  missionsProgress?: Record<string, MissionProgress>;
}

export interface OperationEvent {
  id: string;
  name: string;
  date: string;
  description: string;
  missions: Mission[];
  mapUrl: string;
  isActive: boolean;
}
