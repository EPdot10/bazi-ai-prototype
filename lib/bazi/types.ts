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
  timingSignals: Array<{
    year: number;
    age: number;
    annualPillar: string;
    relations: string[];
    strength: 'strong' | 'moderate';
  }>;
}
