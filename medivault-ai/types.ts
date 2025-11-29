export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  purpose?: string;      // What it treats (e.g., "For Bacterial Infection")
  sideEffects?: string;  // Short summary of side effects
  type?: string;         // Tablet, Capsule, Syrup, etc.
  purchaseProofImage?: string; // Base64 image of the physical med/receipt
}

export interface MedicalAnalysis {
  title: string;
  documentType: 'Prescription' | 'Lab Report' | 'Diagnosis' | 'Other';
  date: string;
  doctorName?: string;
  facilityName?: string;
  patientName?: string;
  diagnosis: string[];
  medications: Medication[];
  summary: string;
  nextSteps: string[];
}

export interface MedicalRecord {
  id: string;
  createdAt: number;
  imageUrl: string; // Base64
  analysis: MedicalAnalysis;
}

export type ViewState = 'home' | 'scan' | 'history' | 'detail' | 'meds' | 'medDetail' | 'schedule' | 'tests';