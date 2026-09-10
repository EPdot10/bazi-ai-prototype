export type BirthTimeConfidence = 'exact' | 'approximate' | 'unknown';

export interface BirthProfile {
  birthDate: string;
  birthTime?: string;
  birthTimeConfidence: BirthTimeConfidence;
  birthPlace: {
    label: string;
    latitude: number;
    longitude: number;
    ianaTimeZone: string;
  };
}

export interface BaziChartFacts {
  pillars: { year: string; month: string; day: string; hour?: string };
  dayMaster: string;
  elementBalance: Record<'wood' | 'fire' | 'earth' | 'metal' | 'water', number>;
  birthTimeConfidence: BirthTimeConfidence;
  calculationNotes: string[];
  verifiedObservations: string[];
  dayMasterElement: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  seasonalStrength: 'supported' | 'balanced' | 'challenged';
  strengthNotes: string[];
  hiddenStems: Record<string, string[]>;
  tenGods: Record<string, string>;
  structuralRelations: string[];
  timeAdjustment?: {
    minutes: number;
    adjustedLocalTime?: string;
    method: 'longitude-and-equation-of-time';
  };
  timingSignals: Array<{
    year: number;
    age: number;
    annualPillar: string;
    relations: string[];
    relationTypes: string[];
    themes: string[];
    domains: string[];
    signature: string;
    strength: 'strong' | 'moderate';
    score: number;
    opportunityScore: number;
    pressureScore: number;
    opportunities: string[];
    risks: string[];
    activatedPillars: string[];
    hourSensitive: boolean;
  }>;
  eventCandidates: Array<{
    year: number;
    age: number;
    window: string;
    themes: string[];
    domains: string[];
    signature: string;
    evidence: string[];
    confidence: 'high' | 'medium' | 'low';
  }>;
  futureSignals: Array<{
    year: number;
    age: number;
    annualPillar: string;
    relations: string[];
    relationTypes: string[];
    themes: string[];
    domains: string[];
    signature: string;
    strength: 'strong' | 'moderate';
    score: number;
    opportunityScore: number;
    pressureScore: number;
    opportunities: string[];
    risks: string[];
    activatedPillars: string[];
    hourSensitive: boolean;
  }>;
  systems: {
    bazi: 'calculated';
    ziwei: 'not-calculated';
    ziweiNote: string;
  };
}
