/**
 * MediVault AI - Gemini AI Service
 * Integration with Google's Gemini API for document analysis
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';
import { MedicalAnalysis, LabTestAnalysis } from '../types';
import { API_CONFIG } from '../constants';

/**
 * Schema for medication data extraction
 */
const medicationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { 
      type: SchemaType.STRING, 
      description: 'Name of the medication' 
    },
    dosage: { 
      type: SchemaType.STRING, 
      description: 'Dosage strength (e.g., 500mg)' 
    },
    frequency: { 
      type: SchemaType.STRING, 
      description: 'How often to take (e.g., Twice a day, after meals)' 
    },
    duration: { 
      type: SchemaType.STRING, 
      description: 'Duration (e.g., 5 days, 1 week)' 
    },
    purpose: { 
      type: SchemaType.STRING, 
      description: "Short purpose of the drug (e.g. 'For Infection', 'Pain Relief')" 
    },
    sideEffects: { 
      type: SchemaType.STRING, 
      description: 'Brief summary of common side effects (max 1 sentence)' 
    },
    type: { 
      type: SchemaType.STRING, 
      description: 'Form of medicine (e.g., Tablet, Capsule, Syrup, Cream)' 
    },
  },
  required: ['name', 'dosage', 'frequency'],
};

/**
 * Schema for complete medical analysis
 */
const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { 
      type: SchemaType.STRING, 
      description: "A short, professional title for this document (e.g., 'Dermatology Consultation', 'Blood Work Results')" 
    },
    documentType: {
      type: SchemaType.STRING,
      enum: ['Prescription', 'Lab Report', 'Diagnosis', 'Other'],
      description: 'The category of the medical document',
    },
    date: { 
      type: SchemaType.STRING, 
      description: "Date of the document (Format: MMM DD, YYYY) or 'Undated'" 
    },
    doctorName: { 
      type: SchemaType.STRING, 
      description: 'Name of the doctor/practitioner without titles if possible, or leave null' 
    },
    facilityName: { 
      type: SchemaType.STRING, 
      description: 'Name of the hospital, clinic or medical center' 
    },
    patientName: { 
      type: SchemaType.STRING, 
      description: 'Name of the patient if visible' 
    },
    diagnosis: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of identified conditions, symptoms, or medical reasons for the visit',
    },
    medications: {
      type: SchemaType.ARRAY,
      items: medicationSchema,
      description: 'List of prescribed medications with precise dosage instructions and insights',
    },
    summary: { 
      type: SchemaType.STRING, 
      description: 'A concise, 2-3 sentence professional summary of the document. Focus on the main reason for the visit and key outcomes. Tone should be reassuring and factual.' 
    },
    nextSteps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Actionable advice or follow-up instructions (e.g., 'Take meds with food', 'Return in 2 weeks')",
    },
  },
  required: ['title', 'documentType', 'diagnosis', 'medications', 'summary'],
};

/**
 * Prompt for the AI model
 */
const ANALYSIS_PROMPT = `You are an expert medical assistant AI. Analyze this image of a medical document (prescription, report, or notes). Extract all relevant medical data into the specified JSON structure. Be extremely precise with medication names and dosages. If handwriting is hard to read, infer from context but mark uncertain parts. Format dates cleanly. Populate the purpose and side effects fields for medications based on general medical knowledge if not explicitly stated in text.`;

/**
 * Analyze a medical document image using Gemini AI
 * @param base64Image - Base64 encoded image data
 * @returns Promise resolving to MedicalAnalysis
 */
export const analyzeMedicalDocument = async (
  base64Image: string
): Promise<MedicalAnalysis> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: API_CONFIG.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: analysisSchema,
      temperature: 0.1, // Low temperature for accurate extraction
    },
  });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      ANALYSIS_PROMPT,
    ]);

    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No response from AI');
    }

    const data = JSON.parse(text) as MedicalAnalysis;
    
    // Validate required fields
    if (!data.title || !data.documentType || !data.summary) {
      throw new Error('Invalid response structure from AI');
    }

    // Ensure arrays are initialized
    data.diagnosis = data.diagnosis || [];
    data.medications = data.medications || [];
    data.nextSteps = data.nextSteps || [];

    return data;
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your configuration.');
      }
      if (error.message.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      if (error.message.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      }
    }
    
    throw new Error('Failed to analyze the document. Please try again.');
  }
};

/**
 * Validate if the Gemini API key is configured
 * @returns boolean indicating if API key exists
 */
export const isGeminiConfigured = (): boolean => {
  return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
};

/**
 * Schema for lab test parameter
 */
const testParameterSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { 
      type: SchemaType.STRING, 
      description: 'Name of the test parameter (e.g., Hemoglobin, Glucose, Creatinine)' 
    },
    value: { 
      type: SchemaType.STRING, 
      description: 'Measured value as shown in the report' 
    },
    unit: { 
      type: SchemaType.STRING, 
      description: 'Unit of measurement (e.g., g/dL, mg/dL, mmol/L)' 
    },
    referenceRange: { 
      type: SchemaType.STRING, 
      description: 'Normal/reference range (e.g., 12.0-16.0, <100)' 
    },
    status: { 
      type: SchemaType.STRING,
      enum: ['normal', 'low', 'high', 'critical'],
      description: 'Status compared to reference range' 
    },
    interpretation: { 
      type: SchemaType.STRING, 
      description: 'Brief interpretation of what this value means for patient health' 
    },
  },
  required: ['name', 'value', 'unit', 'referenceRange', 'status'],
};

/**
 * Schema for test category
 */
const testCategorySchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { 
      type: SchemaType.STRING, 
      description: 'Category name (e.g., Complete Blood Count, Liver Function Tests, Lipid Profile)' 
    },
    parameters: {
      type: SchemaType.ARRAY,
      items: testParameterSchema,
      description: 'List of test parameters in this category',
    },
  },
  required: ['name', 'parameters'],
};

/**
 * Schema for lab test analysis
 */
const labTestSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { 
      type: SchemaType.STRING, 
      description: "A short title for this lab report (e.g., 'Complete Blood Panel', 'Metabolic Panel Results')" 
    },
    date: { 
      type: SchemaType.STRING, 
      description: "Date of the test (Format: MMM DD, YYYY) or 'Undated'" 
    },
    patientName: { 
      type: SchemaType.STRING, 
      description: 'Name of the patient if visible' 
    },
    labName: { 
      type: SchemaType.STRING, 
      description: 'Name of the laboratory or diagnostic center' 
    },
    referringDoctor: { 
      type: SchemaType.STRING, 
      description: 'Name of the doctor who ordered the test' 
    },
    testCategories: {
      type: SchemaType.ARRAY,
      items: testCategorySchema,
      description: 'Categorized test results grouped by type',
    },
    healthSummary: { 
      type: SchemaType.STRING, 
      description: 'A 2-3 sentence summary of overall health based on these results. Be reassuring but factual.' 
    },
    keyFindings: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of notable findings, especially abnormal results that need attention',
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Actionable health recommendations based on the results (e.g., "Increase iron-rich foods", "Follow up with cardiologist")',
    },
    conditionAssessment: { 
      type: SchemaType.STRING,
      enum: ['Excellent', 'Good', 'Fair', 'Needs Attention', 'Critical'],
      description: 'Overall health condition assessment based on test results' 
    },
    conditionExplanation: { 
      type: SchemaType.STRING, 
      description: 'Detailed explanation of the overall condition assessment, explaining why the patient is in this health state based on the test results' 
    },
  },
  required: ['title', 'date', 'testCategories', 'healthSummary', 'keyFindings', 'recommendations', 'conditionAssessment', 'conditionExplanation'],
};

/**
 * Prompt for lab test analysis
 */
const LAB_TEST_PROMPT = `You are an expert medical laboratory analyst AI. Analyze this image of a lab test report and extract all test parameters with their values, units, and reference ranges.

IMPORTANT INSTRUCTIONS:
1. Extract ALL test parameters visible in the report
2. For each parameter, determine if it's normal, low, high, or critical based on the reference range
3. Group related tests into appropriate categories (e.g., CBC, Lipid Panel, Liver Function, Kidney Function, etc.)
4. Provide a clear, patient-friendly health summary
5. Highlight any abnormal values that need attention
6. Provide actionable recommendations based on the results
7. Assess the overall patient condition (Excellent/Good/Fair/Needs Attention/Critical)
8. Explain the condition assessment in simple terms

Be precise with values and units. If handwriting is hard to read, infer from context. Format dates cleanly.`;

/**
 * Analyze a lab test report image using Gemini AI
 * @param base64Image - Base64 encoded image data
 * @returns Promise resolving to LabTestAnalysis
 */
export const analyzeLabTestReport = async (
  base64Image: string
): Promise<LabTestAnalysis> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: API_CONFIG.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: labTestSchema,
      temperature: 0.1, // Low temperature for accurate extraction
    },
  });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      LAB_TEST_PROMPT,
    ]);

    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No response from AI');
    }

    const data = JSON.parse(text) as LabTestAnalysis;
    
    // Validate required fields
    if (!data.title || !data.testCategories || !data.healthSummary) {
      throw new Error('Invalid response structure from AI');
    }

    // Ensure arrays are initialized
    data.testCategories = data.testCategories || [];
    data.keyFindings = data.keyFindings || [];
    data.recommendations = data.recommendations || [];

    return data;
  } catch (error) {
    console.error('Gemini Lab Test Analysis Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your configuration.');
      }
      if (error.message.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      }
      if (error.message.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      }
    }
    
    throw new Error('Failed to analyze the lab report. Please try again.');
  }
};

export default { analyzeMedicalDocument, analyzeLabTestReport, isGeminiConfigured };
