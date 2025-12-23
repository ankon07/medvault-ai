/**
 * MediVault AI - Gemini AI Service
 * Integration with Google's Gemini API for document analysis
 */

import { GoogleGenerativeAI, SchemaType, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';
import { MedicalAnalysis, LabTestAnalysis } from '../types';
import { API_CONFIG } from '../constants';

/**
 * Custom error class for image analysis errors
 */
export class ImageAnalysisError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'ANALYSIS_ERROR') {
    super(message);
    this.name = 'ImageAnalysisError';
    this.code = code;
  }
}

/**
 * Error codes for different failure scenarios
 */
export const ERROR_CODES = {
  INVALID_IMAGE: 'INVALID_IMAGE',
  NOT_MEDICAL_DOCUMENT: 'NOT_MEDICAL_DOCUMENT',
  API_KEY_INVALID: 'API_KEY_INVALID',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SAFETY_BLOCKED: 'SAFETY_BLOCKED',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Safety settings to allow medical content analysis
 */
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

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
const ANALYSIS_PROMPT = `You are an expert medical assistant AI. Analyze this image of a medical document (prescription, report, or notes). Extract all relevant medical data into the specified JSON structure. Be extremely precise with medication names and dosages. If handwriting is hard to read, infer from context but mark uncertain parts. Format dates cleanly. Populate the purpose and side effects fields for medications based on general medical knowledge if not explicitly stated in text.

IMPORTANT: If the image is NOT a medical document (prescription, lab report, diagnosis, or medical notes), you must still return a valid JSON but set:
- title: "Not a Medical Document"
- documentType: "Other"
- summary: "This image does not appear to be a medical document. Please upload a prescription, lab report, or medical diagnosis document."
- diagnosis: []
- medications: []
- nextSteps: []`;

/**
 * Validates if the analysis result indicates a valid medical document
 * @param data - The analysis result
 * @returns boolean indicating if it's a valid medical document
 */
const isValidMedicalDocumentAnalysis = (data: MedicalAnalysis): boolean => {
  // Check if AI indicated this is not a medical document
  if (data.title === 'Not a Medical Document' || 
      data.title?.toLowerCase().includes('not a medical') ||
      data.summary?.toLowerCase().includes('does not appear to be a medical document') ||
      data.summary?.toLowerCase().includes('not a medical document')) {
    return false;
  }
  
  // Check for meaningful content
  const hasMedications = Boolean(data.medications && data.medications.length > 0);
  const hasDiagnosis = Boolean(data.diagnosis && data.diagnosis.length > 0);
  const hasValidSummary = Boolean(data.summary && data.summary.length > 50 && !data.summary.toLowerCase().includes('unable to'));
  
  return hasMedications || hasDiagnosis || hasValidSummary;
};

/**
 * Parse error from Gemini API response
 * @param error - The error object
 * @returns ImageAnalysisError with appropriate code and message
 */
const parseGeminiError = (error: unknown): ImageAnalysisError => {
  console.error('Gemini Analysis Error:', error);
  
  if (error instanceof ImageAnalysisError) {
    return error;
  }
  
  if (error instanceof SyntaxError) {
    return new ImageAnalysisError(
      'Unable to process the image. Please ensure it\'s a clear photo of a medical document.',
      ERROR_CODES.PARSE_ERROR
    );
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Check for API key issues
    if (message.includes('api key') || message.includes('api_key') || message.includes('invalid key')) {
      return new ImageAnalysisError(
        'Invalid API key. Please check your configuration.',
        ERROR_CODES.API_KEY_INVALID
      );
    }
    
    // Check for quota issues
    if (message.includes('quota') || message.includes('rate limit') || message.includes('too many requests')) {
      return new ImageAnalysisError(
        'Service temporarily unavailable. Please try again in a few minutes.',
        ERROR_CODES.QUOTA_EXCEEDED
      );
    }
    
    // Check for network issues
    if (message.includes('network') || message.includes('fetch') || message.includes('connection') || message.includes('timeout')) {
      return new ImageAnalysisError(
        'Network error. Please check your internet connection and try again.',
        ERROR_CODES.NETWORK_ERROR
      );
    }
    
    // Check for safety/content blocking
    if (message.includes('safety') || message.includes('blocked') || message.includes('harm') || message.includes('content')) {
      return new ImageAnalysisError(
        'This image could not be processed. Please try a different image.',
        ERROR_CODES.SAFETY_BLOCKED
      );
    }
    
    // Check for response issues
    if (message.includes('no response') || message.includes('empty response')) {
      return new ImageAnalysisError(
        'Unable to analyze this image. Please ensure it\'s a clear, well-lit photo of a medical document.',
        ERROR_CODES.INVALID_IMAGE
      );
    }
    
    // Check for validation issues
    if (message.includes('invalid response') || message.includes('validation')) {
      return new ImageAnalysisError(
        'Unable to extract medical information from this image. Please try a clearer photo.',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }
  
  // Default error
  return new ImageAnalysisError(
    'Failed to analyze the document. Please try again with a clearer image.',
    ERROR_CODES.UNKNOWN_ERROR
  );
};

/**
 * Analyze a medical document image using Gemini AI
 * @param base64Image - Base64 encoded image data
 * @returns Promise resolving to MedicalAnalysis
 */
export const analyzeMedicalDocument = async (
  base64Image: string
): Promise<MedicalAnalysis> => {
  // Validate API key
  if (!GEMINI_API_KEY) {
    throw new ImageAnalysisError(
      'Gemini API key is not configured. Please add it to your .env file.',
      ERROR_CODES.API_KEY_INVALID
    );
  }

  // Validate base64 image
  if (!base64Image || base64Image.length < 100) {
    throw new ImageAnalysisError(
      'Invalid image data. Please try capturing the image again.',
      ERROR_CODES.INVALID_IMAGE
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: API_CONFIG.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: analysisSchema,
      temperature: 0.1, // Low temperature for accurate extraction
    },
    safetySettings: SAFETY_SETTINGS,
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
    
    // Check for blocked content
    if (response.promptFeedback?.blockReason) {
      throw new ImageAnalysisError(
        'This image could not be processed due to content restrictions. Please try a different image.',
        ERROR_CODES.SAFETY_BLOCKED
      );
    }
    
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new ImageAnalysisError(
        'Unable to analyze this image. Please ensure it\'s a clear photo of a medical document.',
        ERROR_CODES.INVALID_IMAGE
      );
    }

    let data: MedicalAnalysis;
    
    try {
      data = JSON.parse(text) as MedicalAnalysis;
    } catch (parseError) {
      throw new ImageAnalysisError(
        'Unable to process the AI response. Please try again.',
        ERROR_CODES.PARSE_ERROR
      );
    }
    
    // Validate required fields
    if (!data.title || !data.documentType || !data.summary) {
      throw new ImageAnalysisError(
        'Unable to extract medical information from this image. Please try a clearer photo of a medical document.',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check if it's actually a medical document
    if (!isValidMedicalDocumentAnalysis(data)) {
      throw new ImageAnalysisError(
        'This image doesn\'t appear to be a medical document. Please upload a prescription, lab report, or medical diagnosis.',
        ERROR_CODES.NOT_MEDICAL_DOCUMENT
      );
    }

    // Ensure arrays are initialized
    data.diagnosis = data.diagnosis || [];
    data.medications = data.medications || [];
    data.nextSteps = data.nextSteps || [];

    return data;
  } catch (error) {
    // Re-throw ImageAnalysisError as is
    if (error instanceof ImageAnalysisError) {
      throw error;
    }
    
    // Parse and throw appropriate error
    throw parseGeminiError(error);
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

Be precise with values and units. If handwriting is hard to read, infer from context. Format dates cleanly.

IMPORTANT: If the image is NOT a lab test report (blood test, urine test, metabolic panel, etc.), you must still return a valid JSON but set:
- title: "Not a Lab Test Report"
- date: "Undated"
- testCategories: []
- healthSummary: "This image does not appear to be a lab test report. Please upload a blood test, urine test, or other laboratory test results."
- keyFindings: []
- recommendations: []
- conditionAssessment: "Fair"
- conditionExplanation: "Unable to analyze - image does not appear to be a lab test report."`;

/**
 * Validates if the analysis result indicates a valid lab test report
 * @param data - The analysis result
 * @returns boolean indicating if it's a valid lab test report
 */
const isValidLabTestAnalysis = (data: LabTestAnalysis): boolean => {
  // Check if AI indicated this is not a lab test report
  if (data.title === 'Not a Lab Test Report' || 
      data.title?.toLowerCase().includes('not a lab') ||
      data.healthSummary?.toLowerCase().includes('does not appear to be a lab') ||
      data.healthSummary?.toLowerCase().includes('not a lab test') ||
      data.conditionExplanation?.toLowerCase().includes('unable to analyze')) {
    return false;
  }
  
  // Check for meaningful content - must have at least some test parameters
  const hasTestCategories = Boolean(data.testCategories && data.testCategories.length > 0);
  const hasParameters = hasTestCategories && data.testCategories.some(cat => cat.parameters && cat.parameters.length > 0);
  const hasValidSummary = Boolean(data.healthSummary && data.healthSummary.length > 30 && !data.healthSummary.toLowerCase().includes('unable to'));
  
  return hasParameters || hasValidSummary;
};

/**
 * Analyze a lab test report image using Gemini AI
 * @param base64Image - Base64 encoded image data
 * @returns Promise resolving to LabTestAnalysis
 */
export const analyzeLabTestReport = async (
  base64Image: string
): Promise<LabTestAnalysis> => {
  // Validate API key
  if (!GEMINI_API_KEY) {
    throw new ImageAnalysisError(
      'Gemini API key is not configured. Please add it to your .env file.',
      ERROR_CODES.API_KEY_INVALID
    );
  }

  // Validate base64 image
  if (!base64Image || base64Image.length < 100) {
    throw new ImageAnalysisError(
      'Invalid image data. Please try capturing the image again.',
      ERROR_CODES.INVALID_IMAGE
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: API_CONFIG.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: labTestSchema,
      temperature: 0.1, // Low temperature for accurate extraction
    },
    safetySettings: SAFETY_SETTINGS,
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
    
    // Check for blocked content
    if (response.promptFeedback?.blockReason) {
      throw new ImageAnalysisError(
        'This image could not be processed due to content restrictions. Please try a different image.',
        ERROR_CODES.SAFETY_BLOCKED
      );
    }
    
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new ImageAnalysisError(
        'Unable to analyze this image. Please ensure it\'s a clear photo of a lab test report.',
        ERROR_CODES.INVALID_IMAGE
      );
    }

    let data: LabTestAnalysis;
    
    try {
      data = JSON.parse(text) as LabTestAnalysis;
    } catch (parseError) {
      throw new ImageAnalysisError(
        'Unable to process the AI response. Please try again.',
        ERROR_CODES.PARSE_ERROR
      );
    }
    
    // Validate required fields
    if (!data.title || !data.healthSummary) {
      throw new ImageAnalysisError(
        'Unable to extract test information from this image. Please try a clearer photo of a lab report.',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check if it's actually a lab test report
    if (!isValidLabTestAnalysis(data)) {
      throw new ImageAnalysisError(
        'This image doesn\'t appear to be a lab test report. Please upload blood test, urine test, or other laboratory results.',
        ERROR_CODES.NOT_MEDICAL_DOCUMENT
      );
    }

    // Ensure arrays are initialized
    data.testCategories = data.testCategories || [];
    data.keyFindings = data.keyFindings || [];
    data.recommendations = data.recommendations || [];

    return data;
  } catch (error) {
    // Re-throw ImageAnalysisError as is
    if (error instanceof ImageAnalysisError) {
      throw error;
    }
    
    // Parse and throw appropriate error
    throw parseGeminiError(error);
  }
};

/**
 * Schema for medicine pricing extraction
 */
const medicinePricingSchema = {
  type: SchemaType.OBJECT,
  properties: {
    medicineName: { 
      type: SchemaType.STRING, 
      description: 'Name of the medicine from the pack/box' 
    },
    packSize: { 
      type: SchemaType.STRING, 
      description: 'Pack size (e.g., "10 tablets", "30ml syrup", "1 tube")' 
    },
    totalPrice: { 
      type: SchemaType.STRING, 
      description: 'Total price/MRP in BDT (e.g., "15.00 BDT", "৳25.50")' 
    },
    unitCost: { 
      type: SchemaType.STRING, 
      description: 'Unit cost per tablet/ml/unit (e.g., "1.50 BDT per tablet", "৳0.85 per ml")' 
    },
    manufacturer: { 
      type: SchemaType.STRING, 
      description: 'Manufacturer or brand name if visible' 
    },
    expiryDate: { 
      type: SchemaType.STRING, 
      description: 'Expiry date if visible (Format: MMM YYYY or MM/YYYY)' 
    },
  },
  required: ['medicineName', 'packSize', 'totalPrice', 'unitCost'],
};

/**
 * Prompt for medicine pricing analysis
 */
const PRICING_ANALYSIS_PROMPT = `You are an expert pharmaceutical analyst AI. Analyze this image of a medicine pack, box, or label and extract pricing information.

IMPORTANT INSTRUCTIONS:
1. Extract the medicine name exactly as shown on the pack
2. Identify the pack size (number of tablets, ml of syrup, etc.)
3. Find the MRP/price printed on the pack (usually near barcode)
4. Calculate the unit cost by dividing total price by pack size
5. Extract manufacturer/brand name if visible
6. Extract expiry date if visible
7. Use BDT (৳) for currency

CALCULATION EXAMPLE:
- If pack has "10 tablets" and MRP is "৳15.00"
- Unit cost = 15.00 / 10 = "1.50 BDT per tablet"

IMPORTANT: If the image is NOT a medicine pack/box/label, or if pricing information is not visible, you must still return valid JSON but set:
- medicineName: "Unable to identify"
- packSize: "Not visible"
- totalPrice: "Not visible"
- unitCost: "Not visible"
- manufacturer: "Not visible"`;

/**
 * Validates if the pricing analysis result is valid
 * @param data - The pricing analysis result
 * @returns boolean indicating if it's valid pricing data
 */
const isValidPricingAnalysis = (data: any): boolean => {
  // Check if AI indicated unable to identify
  if (data.medicineName === 'Unable to identify' || 
      data.totalPrice === 'Not visible' ||
      data.unitCost === 'Not visible') {
    return false;
  }
  
  // Check for meaningful content
  const hasValidName = Boolean(data.medicineName && data.medicineName.length > 2);
  const hasValidPrice = Boolean(data.totalPrice && data.totalPrice.length > 0);
  const hasValidUnit = Boolean(data.unitCost && data.unitCost.length > 0);
  
  return hasValidName && hasValidPrice && hasValidUnit;
};

/**
 * Analyze a medicine pack/box image to extract pricing information using Gemini AI
 * @param base64Image - Base64 encoded image data
 * @param expectedMedicineName - The expected medicine name for verification (optional)
 * @returns Promise resolving to MedicinePricing
 */
export const analyzeMedicinePricing = async (
  base64Image: string,
  expectedMedicineName?: string
): Promise<import('../types').MedicinePricing> => {
  // Validate API key
  if (!GEMINI_API_KEY) {
    throw new ImageAnalysisError(
      'Gemini API key is not configured. Please add it to your .env file.',
      ERROR_CODES.API_KEY_INVALID
    );
  }

  // Validate base64 image
  if (!base64Image || base64Image.length < 100) {
    throw new ImageAnalysisError(
      'Invalid image data. Please try capturing the image again.',
      ERROR_CODES.INVALID_IMAGE
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: API_CONFIG.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: medicinePricingSchema,
      temperature: 0.1, // Low temperature for accurate extraction
    },
    safetySettings: SAFETY_SETTINGS,
  });

  try {
    // Add expected medicine name to prompt if provided
    let prompt = PRICING_ANALYSIS_PROMPT;
    if (expectedMedicineName) {
      prompt += `\n\nEXPECTED MEDICINE: ${expectedMedicineName}\nPlease verify the medicine name matches or is similar to this.`;
    }

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      prompt,
    ]);

    const response = result.response;
    
    // Check for blocked content
    if (response.promptFeedback?.blockReason) {
      throw new ImageAnalysisError(
        'This image could not be processed. Please try a different image.',
        ERROR_CODES.SAFETY_BLOCKED
      );
    }
    
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new ImageAnalysisError(
        'Unable to analyze this image. Please ensure it\'s a clear photo of a medicine pack.',
        ERROR_CODES.INVALID_IMAGE
      );
    }

    let data: any;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new ImageAnalysisError(
        'Unable to process the AI response. Please try again.',
        ERROR_CODES.PARSE_ERROR
      );
    }
    
    // Validate required fields
    if (!data.medicineName || !data.packSize || !data.totalPrice || !data.unitCost) {
      throw new ImageAnalysisError(
        'Unable to extract pricing information from this image. Please try a clearer photo.',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check if it's actually valid pricing data
    if (!isValidPricingAnalysis(data)) {
      throw new ImageAnalysisError(
        'This image doesn\'t appear to show medicine pricing information clearly. Please capture the medicine pack with visible MRP/price.',
        ERROR_CODES.NOT_MEDICAL_DOCUMENT
      );
    }

    // Return complete pricing data
    return {
      medicineName: data.medicineName,
      packSize: data.packSize,
      totalPrice: data.totalPrice,
      unitCost: data.unitCost,
      manufacturer: data.manufacturer,
      expiryDate: data.expiryDate,
      extractedAt: Date.now(),
      imageUrl: base64Image,
    };
  } catch (error) {
    // Re-throw ImageAnalysisError as is
    if (error instanceof ImageAnalysisError) {
      throw error;
    }
    
    // Parse and throw appropriate error
    throw parseGeminiError(error);
  }
};

export default { 
  analyzeMedicalDocument, 
  analyzeLabTestReport, 
  analyzeMedicinePricing,
  isGeminiConfigured 
};
