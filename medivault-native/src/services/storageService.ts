/**
 * MediVault AI - Storage Service
 * AsyncStorage wrapper for data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import { MedicalRecord } from '../types';

/**
 * Storage service for managing persistent data
 */
class StorageService {
  /**
   * Get all medical records from storage
   * @returns Promise resolving to array of MedicalRecord
   */
  async getRecords(): Promise<MedicalRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
      if (!data) return [];
      
      const records = JSON.parse(data) as MedicalRecord[];
      // Sort by creation date (newest first)
      return records.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error reading records from storage:', error);
      return [];
    }
  }

  /**
   * Save a new medical record
   * @param record - MedicalRecord to save
   * @returns Promise resolving when save is complete
   */
  async saveRecord(record: MedicalRecord): Promise<void> {
    try {
      const records = await this.getRecords();
      const updatedRecords = [record, ...records];
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECORDS, 
        JSON.stringify(updatedRecords)
      );
    } catch (error) {
      console.error('Error saving record:', error);
      throw new Error('Failed to save record. Storage may be full.');
    }
  }

  /**
   * Update an existing record
   * @param recordId - ID of the record to update
   * @param updates - Partial record with updates
   * @returns Promise resolving when update is complete
   */
  async updateRecord(
    recordId: string, 
    updates: Partial<MedicalRecord>
  ): Promise<void> {
    try {
      const records = await this.getRecords();
      const index = records.findIndex(r => r.id === recordId);
      
      if (index === -1) {
        throw new Error('Record not found');
      }
      
      records[index] = { ...records[index], ...updates };
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECORDS, 
        JSON.stringify(records)
      );
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  /**
   * Delete a record by ID
   * @param recordId - ID of the record to delete
   * @returns Promise resolving when deletion is complete
   */
  async deleteRecord(recordId: string): Promise<void> {
    try {
      const records = await this.getRecords();
      const filteredRecords = records.filter(r => r.id !== recordId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECORDS, 
        JSON.stringify(filteredRecords)
      );
    } catch (error) {
      console.error('Error deleting record:', error);
      throw new Error('Failed to delete record');
    }
  }

  /**
   * Get a single record by ID
   * @param recordId - ID of the record to retrieve
   * @returns Promise resolving to MedicalRecord or null
   */
  async getRecordById(recordId: string): Promise<MedicalRecord | null> {
    try {
      const records = await this.getRecords();
      return records.find(r => r.id === recordId) || null;
    } catch (error) {
      console.error('Error fetching record:', error);
      return null;
    }
  }

  /**
   * Clear all records from storage
   * @returns Promise resolving when clear is complete
   */
  async clearAllRecords(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECORDS);
    } catch (error) {
      console.error('Error clearing records:', error);
      throw new Error('Failed to clear records');
    }
  }

  /**
   * Get storage statistics
   * @returns Promise resolving to storage info
   */
  async getStorageInfo(): Promise<{
    totalRecords: number;
    prescriptions: number;
    labReports: number;
    diagnoses: number;
    totalMedications: number;
  }> {
    try {
      const records = await this.getRecords();
      
      return {
        totalRecords: records.length,
        prescriptions: records.filter(
          r => r.analysis.documentType === 'Prescription'
        ).length,
        labReports: records.filter(
          r => r.analysis.documentType === 'Lab Report'
        ).length,
        diagnoses: records.filter(
          r => r.analysis.documentType === 'Diagnosis'
        ).length,
        totalMedications: records.reduce(
          (acc, r) => acc + r.analysis.medications.length, 
          0
        ),
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        totalRecords: 0,
        prescriptions: 0,
        labReports: 0,
        diagnoses: 0,
        totalMedications: 0,
      };
    }
  }

  /**
   * Update medication proof image
   * @param recordId - ID of the source record
   * @param medicationName - Name of the medication
   * @param proofImage - Base64 proof image
   */
  async updateMedicationProof(
    recordId: string,
    medicationName: string,
    proofImage: string
  ): Promise<void> {
    try {
      const records = await this.getRecords();
      const recordIndex = records.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) {
        throw new Error('Record not found');
      }
      
      const record = records[recordIndex];
      const medIndex = record.analysis.medications.findIndex(
        m => m.name === medicationName
      );
      
      if (medIndex === -1) {
        throw new Error('Medication not found');
      }
      
      record.analysis.medications[medIndex].purchaseProofImage = proofImage;
      records[recordIndex] = record;
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECORDS, 
        JSON.stringify(records)
      );
    } catch (error) {
      console.error('Error updating medication proof:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
