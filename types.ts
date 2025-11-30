
export interface Mutation {
  position: number;
  ref: string;
  alt: string;
  type: string;
  typeZh: string; // Chinese type
  impact: 'HIGH' | 'MODERATE' | 'LOW';
  score: number; // 0-100 Pathogenicity
  associatedDisease: string;
  associatedDiseaseZh: string;
  cdsChange: string; // e.g., c.454T>A
  aaChange: string;  // e.g., p.Phe152Ile
}

export interface GeneticSample {
  id: string;
  filename: string;
  patientId: string;
  geneTarget: string;
  chromosome: string; // e.g., "7", "X"
  cytoband: string;   // e.g., "q31.2"
  startPosition: number; // Genomic start coordinates
  locus: string; // e.g., Exon 10
  sequence: string; // Genomic DNA
  cdnaSequence: string; // Coding DNA
  proteinSequence: string; // Amino acid sequence
  mutations: Mutation[];
  uploadDate: string;
}

export interface ProteinStructure {
  id: string;
  pdbId: string;
  name: string;
  nameZh: string;
  category: string;
  categoryZh: string;
  molecularWeight: string;
  resolution: string;
  chainCount: number;
  description: string;
  descriptionZh: string;
}

export interface TeamMember {
  name: string;
  role: string;
  roleZh: string;
  description: string;
  descriptionZh: string;
  avatar?: string;
  isAdvisor?: boolean;
}

export type TabView = 'dashboard' | 'screening' | 'drug-discovery' | 'team';

export type Language = 'en' | 'zh';
