/**
 * MediVault AI - Med Detail Screen
 * Detailed view of a single medication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ChevronLeft,
  Pill,
  Droplets,
  Tablets,
  Clock,
  Calendar,
  AlertTriangle,
  Activity,
  FileText,
  Sparkles,
  Camera,
  DollarSign,
  ShoppingCart,
  MapPin,
  Store,
  Package,
  HeartPulse,
  ShoppingBag,
  Building,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { MedicinePricing } from '../types';
import { captureImage, selectImage } from '../services/imageService';
import { searchMedicinePricing, extractPriceFromSnippet, MedicineSearchResult } from '../services/googleSearchService';
import { LoadingOverlay } from '../components/common';
import { PHARMACY_LINKS, generatePharmacySearchUrl, generateNearbyPharmaciesUrl } from '../constants/pharmacies';
import storageService from '../services/storageService';
import { useRecordStore } from '../store/useRecordStore';

type MedDetailRouteProp = RouteProp<RootStackParamList, 'MedDetail'>;

const MedDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<MedDetailRouteProp>();
  const { updateRecord, getRecordById } = useRecordStore();
  
  const { medication, sourceId } = route.params;
  
  const [pricing, setPricing] = useState<MedicinePricing | undefined>(medication.pricing);
  const [medicineImage, setMedicineImage] = useState<string | undefined>(medication.pricing?.imageUrl);
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualPackSize, setManualPackSize] = useState('');
  const [manualTotalPrice, setManualTotalPrice] = useState('');
  const [manualManufacturer, setManualManufacturer] = useState('');
  const [manualExpiry, setManualExpiry] = useState('');

  // Load pricing and image from database on mount
  React.useEffect(() => {
    const loadPricingFromDatabase = () => {
      if (sourceId) {
        try {
          // Use store's getRecordById which has Firebase data
          const record = getRecordById(sourceId);
          if (record) {
            const med = record.analysis.medications.find(m => m.name === medication.name);
            if (med?.pricing) {
              console.log('Loading pricing from store:', med.pricing);
              setPricing(med.pricing);
              if (med.pricing.imageUrl) {
                setMedicineImage(med.pricing.imageUrl);
              }
            }
          } else {
            console.warn('Record not found in store:', sourceId);
          }
        } catch (error) {
          console.error('Failed to load pricing from store:', error);
        }
      }
    };

    loadPricingFromDatabase();
  }, [sourceId, medication.name, getRecordById]);

  const getMedIcon = (type?: string) => {
    if (type?.toLowerCase().includes('syrup') || type?.toLowerCase().includes('liquid')) {
      return Droplets;
    }
    if (type?.toLowerCase().includes('capsule')) {
      return Pill;
    }
    return Tablets;
  };

  const IconComponent = getMedIcon(medication.type);

  const handleViewSource = () => {
    if (sourceId) {
      navigation.navigate('Detail', { recordId: sourceId } as never);
    }
  };

  const handleAddPricing = async () => {
    try {
      setSearchError(null);
      
      // Show action sheet to choose between camera, gallery, or manual entry
      Alert.alert(
        'Add Pricing Info',
        'Choose how to add pricing information',
        [
          {
            text: 'Take Photo',
            onPress: () => handleImageCapture('camera'),
          },
          {
            text: 'Choose from Gallery',
            onPress: () => handleImageCapture('gallery'),
          },
          {
            text: 'Enter Manually',
            onPress: () => {
              setShowManualEntry(true);
              setManualPackSize('');
              setManualTotalPrice('');
              setManualManufacturer('');
              setManualExpiry('');
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      setSearchError(error.message || 'Failed to start image capture');
      Alert.alert('Error', error.message || 'Failed to start image capture');
    }
  };

  const handleManualPricingSave = async () => {
    // Validate inputs
    if (!manualPackSize.trim() || !manualTotalPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter pack size and total price.');
      return;
    }

    try {
      // Extract numbers for calculation
      const packSizeNum = parseFloat(manualPackSize.match(/[\d.]+/)?.[0] || '0');
      const totalPriceNum = parseFloat(manualTotalPrice.replace(/[^\d.]/g, ''));

      if (packSizeNum <= 0 || totalPriceNum <= 0) {
        Alert.alert('Invalid Values', 'Please enter valid numeric values.');
        return;
      }

      // Calculate unit cost
      const unitCostNum = totalPriceNum / packSizeNum;
      const unitCostStr = `৳${unitCostNum.toFixed(2)} per unit`;

      // Create pricing data
      const pricingData: MedicinePricing = {
        medicineName: medication.name,
        packSize: manualPackSize.trim(),
        totalPrice: `৳${totalPriceNum.toFixed(2)}`,
        unitCost: unitCostStr,
        manufacturer: manualManufacturer.trim() || undefined,
        expiryDate: manualExpiry.trim() || undefined,
        extractedAt: Date.now(),
        imageUrl: medicineImage || undefined, // Keep existing image if any
      };

      setPricing(pricingData);
      setShowManualEntry(false);

      // Try to save to storage if we have a source ID
      if (sourceId) {
        try {
          // Get record from store (has Firebase data)
          const record = getRecordById(sourceId);
          if (record) {
            // Update pricing in the record
            const updatedMedications = record.analysis.medications.map(med =>
              med.name === medication.name ? { ...med, pricing: pricingData } : med
            );
            
            const updatedRecord = {
              ...record,
              analysis: {
                ...record.analysis,
                medications: updatedMedications,
              },
            };
            
            // Update store (syncs to Firebase and local storage)
            await updateRecord(sourceId, updatedRecord);
            
            console.log('Manual pricing saved successfully and synced');
            Alert.alert('Success!', 'Pricing information saved successfully and synced to cloud.');
          } else {
            console.error('Source record not found in store:', sourceId);
            Alert.alert('Error', 'Could not find the medication record. Please try again or rescan the prescription.');
          }
        } catch (storageError: any) {
          console.error('Failed to save pricing:', storageError);
          Alert.alert('Error', 'Failed to save pricing: ' + storageError.message);
        }
      } else {
        console.error('No sourceId provided');
        Alert.alert('Error', 'Cannot save pricing without a source prescription. Please add this medication from a prescription first.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save pricing information.');
    }
  };

  const handleImageCapture = async (source: 'camera' | 'gallery') => {
    try {
      setIsSearching(true);
      setSearchError(null);

      // Capture or select image
      const result = source === 'camera' ? await captureImage() : await selectImage();

      if (!result.success || !result.base64) {
        setIsSearching(false);
        if (result.error && !result.error.includes('cancelled')) {
          Alert.alert('Error', result.error);
        }
        return;
      }

      // Store the captured image
      setMedicineImage(result.base64);

      // Search for medicine pricing using Google Search API
      const searchData = await searchMedicinePricing(medication.name);
      
      setSearchResults(searchData.sources);
      
      // Try to extract price from first result
      let extractedPrice: string | null = null;
      if (searchData.sources.length > 0) {
        extractedPrice = extractPriceFromSnippet(searchData.sources[0].snippet);
      }

      // Create pricing data
      const pricingData: MedicinePricing = {
        medicineName: medication.name,
        packSize: 'See online stores',
        totalPrice: extractedPrice || 'Check links below',
        unitCost: 'See online stores',
        extractedAt: Date.now(),
        imageUrl: result.base64,
      };

      setPricing(pricingData);
      
      // Try to save to storage if we have a source ID
      if (sourceId) {
        try {
          // Get record from store (has Firebase data)
          const record = getRecordById(sourceId);
          if (record) {
            // Update pricing in the record
            const updatedMedications = record.analysis.medications.map(med =>
              med.name === medication.name ? { ...med, pricing: pricingData } : med
            );
            
            const updatedRecord = {
              ...record,
              analysis: {
                ...record.analysis,
                medications: updatedMedications,
              },
            };
            
            // Update store (syncs to Firebase and local storage)
            await updateRecord(sourceId, updatedRecord);
            console.log('Pricing with image saved successfully and synced');
          } else {
            console.error('Source record not found in store for image save:', sourceId);
          }
        } catch (storageError: any) {
          console.error('Failed to save pricing with image:', storageError);
          // Continue anyway - pricing is still available in state for this session
        }
      } else {
        console.warn('No sourceId provided for image save');
      }

      setIsSearching(false);

      const resultMessage = searchData.sources.length > 0
        ? `Found ${searchData.sources.length} results. Tap on pharmacy links below to view pricing details.`
        : 'Search completed. Please check the pharmacy links below to find pricing manually.';

      Alert.alert(
        'Image Captured!',
        resultMessage,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setIsSearching(false);
      setSearchError(error.message || 'Failed to search for pricing');
      Alert.alert(
        'Search Failed',
        error.message || 'Unable to search for medicine pricing. Please check your internet connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePharmacyPress = async (pharmacyName: string, url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open pharmacy link');
    }
  };

  const handleFindNearbyPharmacies = async () => {
    try {
      const url = generateNearbyPharmaciesUrl();
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open maps');
    }
  };

  const getPharmacyIcon = (iconName: string) => {
    switch (iconName) {
      case 'store':
        return Store;
      case 'pill':
        return Pill;
      case 'heart-pulse':
        return HeartPulse;
      case 'shopping-bag':
        return ShoppingBag;
      case 'package':
        return Package;
      case 'building':
        return Building;
      default:
        return ShoppingCart;
    }
  };

  const calculateTreatmentCost = () => {
    if (!pricing || !medication.frequency || !medication.duration) {
      return null;
    }

    // Extract numeric unit cost
    const unitCostMatch = pricing.unitCost.match(/[\d.]+/);
    if (!unitCostMatch) return null;
    const unitCost = parseFloat(unitCostMatch[0]);

    // Estimate doses per day from frequency
    let dosesPerDay = 1;
    const freq = medication.frequency.toLowerCase();
    if (freq.includes('twice') || freq.includes('2')) dosesPerDay = 2;
    else if (freq.includes('thrice') || freq.includes('three') || freq.includes('3')) dosesPerDay = 3;
    else if (freq.includes('four') || freq.includes('4')) dosesPerDay = 4;

    // Extract days from duration
    let days = 0;
    const dur = medication.duration.toLowerCase();
    if (dur.includes('day')) {
      const dayMatch = dur.match(/(\d+)\s*day/);
      if (dayMatch) days = parseInt(dayMatch[1]);
    } else if (dur.includes('week')) {
      const weekMatch = dur.match(/(\d+)\s*week/);
      if (weekMatch) days = parseInt(weekMatch[1]) * 7;
    } else if (dur.includes('month')) {
      const monthMatch = dur.match(/(\d+)\s*month/);
      if (monthMatch) days = parseInt(monthMatch[1]) * 30;
    }

    if (days === 0) return null;

    const dailyCost = unitCost * dosesPerDay;
    const totalCost = dailyCost * days;

    return {
      dailyCost: dailyCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      dosesPerDay,
      days,
    };
  };

  const treatmentCost = calculateTreatmentCost();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Medication Details</Text>
          <Text style={styles.headerSubtitle}>{medication.type || 'Medication'}</Text>
        </View>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        {/* Captured Medicine Image */}
        {medicineImage && (
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${medicineImage}` }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        {!medicineImage && (
          <View style={styles.heroIcon}>
            <IconComponent size={48} color={colors.blue[500]} />
          </View>
        )}
        
        <Text style={styles.medName}>{medication.name}</Text>
        <View style={styles.dosageBadge}>
          <Text style={styles.dosageText}>{medication.dosage}</Text>
        </View>
      </View>

      {/* Schedule Info */}
      <View style={styles.scheduleCard}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.scheduleGrid}>
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleIcon}>
              <Clock size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.scheduleLabel}>Frequency</Text>
            <Text style={styles.scheduleValue}>{medication.frequency}</Text>
          </View>
          {medication.duration && (
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIcon}>
                <Calendar size={20} color={colors.purple[600]} />
              </View>
              <Text style={styles.scheduleLabel}>Duration</Text>
              <Text style={styles.scheduleValue}>{medication.duration}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Purpose */}
      {medication.purpose && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={[styles.infoIcon, { backgroundColor: colors.green[100] }]}>
              <Activity size={18} color={colors.green[600]} />
            </View>
            <Text style={styles.infoTitle}>Purpose</Text>
          </View>
          <Text style={styles.infoText}>{medication.purpose}</Text>
        </View>
      )}

      {/* Side Effects */}
      {medication.sideEffects && (
        <View style={[styles.infoCard, styles.warningCard]}>
          <View style={styles.infoHeader}>
            <View style={[styles.infoIcon, { backgroundColor: colors.amber[50] }]}>
              <AlertTriangle size={18} color={colors.amber[400]} />
            </View>
            <Text style={[styles.infoTitle, { color: colors.amber[900] }]}>
              Potential Side Effects
            </Text>
          </View>
          <Text style={[styles.infoText, { color: colors.amber[800] }]}>
            {medication.sideEffects}
          </Text>
        </View>
      )}

      {/* AI Insight */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Sparkles size={16} color={colors.white} />
          <Text style={styles.aiLabel}>AI Insight</Text>
        </View>
        <Text style={styles.aiText}>
          Take {medication.name} {medication.frequency.toLowerCase()}
          {medication.duration ? ` for ${medication.duration}` : ''}.
          {medication.purpose ? ` This medication helps with ${medication.purpose.toLowerCase()}.` : ''}
          {medication.sideEffects ? ' Watch for any unusual reactions and consult your doctor if needed.' : ''}
        </Text>
      </View>

      {/* Pricing Information Card */}
      {pricing ? (
        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>💊 Pricing Information</Text>
          
          {/* Medicine Pack Image Thumbnail */}
          {pricing.imageUrl && (
            <View style={styles.pricingImageContainer}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${pricing.imageUrl}` }}
                style={styles.pricingImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.pricingDetails}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Pack Size</Text>
              <Text style={styles.pricingValue}>{pricing.packSize}</Text>
            </View>
            
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Total Price</Text>
              <Text style={styles.pricingValue}>{pricing.totalPrice}</Text>
            </View>

            <View style={styles.unitCostHighlight}>
              <DollarSign size={20} color={colors.primary[700]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.unitCostLabel}>Unit Cost</Text>
                <Text style={styles.unitCostValue}>{pricing.unitCost}</Text>
              </View>
            </View>

            {pricing.manufacturer && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Manufacturer</Text>
                <Text style={styles.pricingValue}>{pricing.manufacturer}</Text>
              </View>
            )}

            {pricing.expiryDate && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Expires</Text>
                <Text style={styles.pricingValue}>{pricing.expiryDate}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.updatePricingButton} onPress={handleAddPricing}>
            <Camera size={16} color={colors.primary[600]} />
            <Text style={styles.updatePricingText}>Update Pricing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addPricingCard} onPress={handleAddPricing}>
          <View style={styles.addPricingIcon}>
            <Camera size={32} color={colors.primary[600]} />
          </View>
          <Text style={styles.addPricingTitle}>Add Pricing Information</Text>
          <Text style={styles.addPricingText}>
            Scan the medicine pack to extract pricing details, unit cost, and expiry date
          </Text>
        </TouchableOpacity>
      )}

      {/* Treatment Cost Calculator */}
      {treatmentCost && (
        <View style={styles.costCard}>
          <View style={styles.costHeader}>
            <DollarSign size={20} color={colors.green[600]} />
            <Text style={styles.sectionTitle}>💰 Treatment Cost Estimate</Text>
          </View>
          
          <View style={styles.costDetails}>
            <Text style={styles.costInfo}>
              Dosage: {treatmentCost.dosesPerDay} dose{treatmentCost.dosesPerDay > 1 ? 's' : ''} per day
            </Text>
            <Text style={styles.costInfo}>
              Duration: {treatmentCost.days} day{treatmentCost.days > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.costResults}>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Daily Cost</Text>
              <Text style={styles.costValue}>৳{treatmentCost.dailyCost}</Text>
            </View>
            <View style={[styles.costItem, styles.totalCostItem]}>
              <Text style={styles.totalCostLabel}>Total Cost</Text>
              <Text style={styles.totalCostValue}>৳{treatmentCost.totalCost}</Text>
            </View>
          </View>

          <Text style={styles.costDisclaimer}>
            ℹ️ Based on unit cost of {pricing?.unitCost}
          </Text>
        </View>
      )}

      {/* Order Online Section */}
      <View style={styles.pharmacyCard}>
        <Text style={styles.sectionTitle}>🛒 Order Online</Text>
        <Text style={styles.pharmacySectionText}>
          Search for {medication.name} on these trusted pharmacy platforms
        </Text>
        
        <View style={styles.pharmacyGrid}>
          {PHARMACY_LINKS.map((pharmacy) => {
            const PharmacyIcon = getPharmacyIcon(pharmacy.icon);
            return (
              <TouchableOpacity
                key={pharmacy.name}
                style={[styles.pharmacyButton, { borderColor: pharmacy.color }]}
                onPress={() => 
                  handlePharmacyPress(
                    pharmacy.name, 
                    generatePharmacySearchUrl(pharmacy, medication.name)
                  )
                }
              >
                <View style={[styles.pharmacyIconContainer, { backgroundColor: pharmacy.color + '20' }]}>
                  <PharmacyIcon size={24} color={pharmacy.color} />
                </View>
                <Text style={styles.pharmacyName} numberOfLines={1}>
                  {pharmacy.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Find Nearby Pharmacies */}
      <TouchableOpacity style={styles.mapButton} onPress={handleFindNearbyPharmacies}>
        <MapPin size={20} color={colors.white} />
        <Text style={styles.mapButtonText}>Find Nearby Pharmacies</Text>
      </TouchableOpacity>

      {/* Purchase Proof Image */}
      {medication.purchaseProofImage && (
        <View style={styles.proofSection}>
          <Text style={styles.sectionTitle}>Purchase Proof</Text>
          <View style={styles.proofImageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${medication.purchaseProofImage}` }}
              style={styles.proofImage}
              resizeMode="contain"
            />
          </View>
        </View>
      )}

      {/* View Source Prescription */}
      {sourceId && (
        <TouchableOpacity style={styles.sourceButton} onPress={handleViewSource}>
          <FileText size={18} color={colors.text.secondary} />
          <Text style={styles.sourceButtonText}>View Original Prescription</Text>
        </TouchableOpacity>
      )}

      {/* Manual Pricing Entry Modal/Form */}
      {showManualEntry && (
        <View style={styles.manualEntryOverlay}>
          <View style={styles.manualEntryCard}>
            <Text style={styles.manualEntryTitle}>Enter Pricing Manually</Text>
            <Text style={styles.manualEntrySubtitle}>
              Fill in the pricing details for {medication.name}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pack Size *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10 tablets, 30ml syrup"
                placeholderTextColor={colors.gray[400]}
                value={manualPackSize}
                onChangeText={setManualPackSize}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Price (BDT) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 150 or ৳150"
                placeholderTextColor={colors.gray[400]}
                value={manualTotalPrice}
                onChangeText={setManualTotalPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Manufacturer (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Square Pharmaceuticals"
                placeholderTextColor={colors.gray[400]}
                value={manualManufacturer}
                onChangeText={setManualManufacturer}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expiry Date (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dec 2025"
                placeholderTextColor={colors.gray[400]}
                value={manualExpiry}
                onChangeText={setManualExpiry}
              />
            </View>

            <View style={styles.manualEntryButtons}>
              <TouchableOpacity
                style={styles.manualEntryCancelButton}
                onPress={() => setShowManualEntry(false)}
              >
                <Text style={styles.manualEntryCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualEntrySaveButton}
                onPress={handleManualPricingSave}
              >
                <Text style={styles.manualEntrySaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: spacing['24'] }} />
      
      {/* Loading Overlay */}
      <LoadingOverlay visible={isSearching} message="Searching for medicine pricing..." />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing['6'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['6'],
  },
  backButton: {
    padding: spacing['2'],
    marginRight: spacing['3'],
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['4xl'],
    padding: spacing['8'],
    alignItems: 'center',
    marginBottom: spacing['6'],
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius['3xl'],
    backgroundColor: colors.blue[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['4'],
  },
  heroImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    marginBottom: spacing['4'],
    backgroundColor: colors.gray[50],
    ...shadows.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  medName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing['3'],
  },
  dosageBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  dosageText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['4'],
  },
  scheduleGrid: {
    flexDirection: 'row',
    gap: spacing['4'],
  },
  scheduleItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    alignItems: 'center',
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2'],
    ...shadows.sm,
  },
  scheduleLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing['1'],
  },
  scheduleValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['5'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  warningCard: {
    backgroundColor: colors.amber[50],
    borderColor: colors.amber[100],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['3'],
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  aiCard: {
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius['3xl'],
    padding: spacing['5'],
    marginBottom: spacing['4'],
    ...shadows.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['3'],
  },
  aiLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiText: {
    fontSize: fontSize.sm,
    color: colors.gray[200],
    lineHeight: 22,
  },
  proofSection: {
    marginBottom: spacing['4'],
  },
  proofImageContainer: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  proofImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray[50],
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  sourceButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
  },
  // Pricing Card Styles
  pricingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pricingImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing['4'],
    backgroundColor: colors.gray[50],
  },
  pricingImage: {
    width: '100%',
    height: '100%',
  },
  pricingDetails: {
    gap: spacing['3'],
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['2'],
  },
  pricingLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  pricingValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.semiBold,
  },
  unitCostHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing['4'],
    borderRadius: borderRadius['2xl'],
    gap: spacing['3'],
    marginVertical: spacing['2'],
  },
  unitCostLabel: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  unitCostValue: {
    fontSize: fontSize.lg,
    color: colors.primary[700],
    fontWeight: fontWeight.bold,
  },
  updatePricingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    marginTop: spacing['4'],
    paddingVertical: spacing['3'],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  updatePricingText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.semiBold,
  },
  // Add Pricing Card Styles
  addPricingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['8'],
    marginBottom: spacing['4'],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },
  addPricingIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['4'],
  },
  addPricingTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  addPricingText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Cost Calculator Styles
  costCard: {
    backgroundColor: colors.green[100],
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    borderWidth: 1,
    borderColor: colors.green[500],
  },
  costHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginBottom: spacing['4'],
  },
  costDetails: {
    gap: spacing['2'],
    marginBottom: spacing['4'],
  },
  costInfo: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  costResults: {
    flexDirection: 'row',
    gap: spacing['4'],
    marginBottom: spacing['3'],
  },
  costItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    alignItems: 'center',
  },
  totalCostItem: {
    backgroundColor: colors.green[600],
  },
  costLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: spacing['1'],
  },
  costValue: {
    fontSize: fontSize.xl,
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
  totalCostLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: spacing['1'],
  },
  totalCostValue: {
    fontSize: fontSize.xl,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  costDisclaimer: {
    fontSize: fontSize.xs,
    color: colors.green[600],
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Pharmacy Links Styles
  pharmacyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pharmacySectionText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing['4'],
  },
  pharmacyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['3'],
  },
  pharmacyButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3'],
    ...shadows.sm,
  },
  pharmacyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2'],
  },
  pharmacyName: {
    fontSize: fontSize.xs,
    color: colors.text.primary,
    fontWeight: fontWeight.semiBold,
    textAlign: 'center',
  },
  // Map Button Styles
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius['2xl'],
    padding: spacing['4'],
    marginBottom: spacing['4'],
    ...shadows.md,
  },
  mapButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // Manual Entry Styles
  manualEntryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['6'],
  },
  manualEntryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  manualEntryTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  manualEntrySubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing['6'],
  },
  inputGroup: {
    marginBottom: spacing['4'],
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing['4'],
    fontSize: fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  manualEntryButtons: {
    flexDirection: 'row',
    gap: spacing['3'],
    marginTop: spacing['4'],
  },
  manualEntryCancelButton: {
    flex: 1,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.xl,
    padding: spacing['4'],
    alignItems: 'center',
  },
  manualEntryCancelText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    color: colors.gray[700],
  },
  manualEntrySaveButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.xl,
    padding: spacing['4'],
    alignItems: 'center',
    ...shadows.md,
  },
  manualEntrySaveText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

export default MedDetailScreen;
