import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MedicalAnalysis } from "../types";

// Schema definition for structured output
const medicationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the medication" },
    dosage: { type: Type.STRING, description: "Dosage strength (e.g., 500mg)" },
    frequency: { type: Type.STRING, description: "How often to take (e.g., Twice a day, after meals)" },
    duration: { type: Type.STRING, description: "Duration (e.g., 5 days, 1 week)" },
    purpose: { type: Type.STRING, description: "Short purpose of the drug (e.g. 'For Infection', 'Pain Relief')" },
    sideEffects: { type: Type.STRING, description: "Brief summary of common side effects (max 1 sentence)" },
    type: { type: Type.STRING, description: "Form of medicine (e.g., Tablet, Capsule, Syrup, Cream)" }
  },
  required: ["name", "dosage", "frequency"],
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A short, professional title for this document (e.g., 'Dermatology Consultation', 'Blood Work Results')" },
    documentType: { 
      type: Type.STRING, 
      enum: ['Prescription', 'Lab Report', 'Diagnosis', 'Other'],
      description: "The category of the medical document" 
    },
    date: { type: Type.STRING, description: "Date of the document (Format: MMM DD, YYYY) or 'Undated'" },
    doctorName: { type: Type.STRING, description: "Name of the doctor/practitioner without titles if possible, or leave null" },
    facilityName: { type: Type.STRING, description: "Name of the hospital, clinic or medical center" },
    patientName: { type: Type.STRING, description: "Name of the patient if visible" },
    diagnosis: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of identified conditions, symptoms, or medical reasons for the visit" 
    },
    medications: {
      type: Type.ARRAY,
      items: medicationSchema,
      description: "List of prescribed medications with precise dosage instructions and insights"
    },
    summary: { type: Type.STRING, description: "A concise, 2-3 sentence professional summary of the document. Focus on the main reason for the visit and key outcomes. Tone should be reassuring and factual." },
    nextSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Actionable advice or follow-up instructions (e.g., 'Take meds with food', 'Return in 2 weeks')"
    }
  },
  required: ["title", "documentType", "diagnosis", "medications", "summary"],
};

export const analyzeMedicalDocument = async (base64Image: string): Promise<MedicalAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "You are an expert medical assistant AI. Analyze this image of a medical document (prescription, report, or notes). Extract all relevant medical data into the specified JSON structure. Be extremely precise with medication names and dosages. If handwriting is hard to read, infer from context but mark uncertain parts. Format dates cleanly. Populate the purpose and side effects fields for medications based on general medical knowledge if not explicitly stated in text.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1, // Very low temperature for high accuracy extraction
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as MedicalAnalysis;
    return data;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the document. Please try again.");
  }
};