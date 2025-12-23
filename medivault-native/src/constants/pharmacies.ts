/**
 * MediVault AI - Pharmacy Links
 * Online pharmacy platforms for ordering medicines in Bangladesh
 */

import { PharmacyLink } from '../types';

/**
 * Popular online pharmacies in Bangladesh
 */
export const PHARMACY_LINKS: PharmacyLink[] = [
  {
    name: 'Pharmacy.com.bd',
    baseUrl: 'https://www.pharmacy.com.bd/search?q=',
    icon: 'store',
    color: '#10b981', // green
  },
  {
    name: 'Osudpotro',
    baseUrl: 'https://osudpotro.com/search?medicine=',
    icon: 'pill',
    color: '#3b82f6', // blue
  },
  {
    name: 'Medeasy',
    baseUrl: 'https://medeasy.health/search?q=',
    icon: 'heart-pulse',
    color: '#ef4444', // red
  },
  {
    name: 'Arogga',
    baseUrl: 'https://arogga.com/search?name=',
    icon: 'shopping-bag',
    color: '#8b5cf6', // purple
  },
  {
    name: 'Lazz Pharma',
    baseUrl: 'https://lazzpharma.com/shop?s=',
    icon: 'package',
    color: '#f59e0b', // amber
  },
  {
    name: 'HealthWarehouse',
    baseUrl: 'https://healthwarehouse.com.bd/search?q=',
    icon: 'building',
    color: '#06b6d4', // cyan
  },
];

/**
 * Generate search URL for a specific pharmacy
 * @param pharmacy - The pharmacy to search in
 * @param medicineName - Name of the medicine to search
 * @returns Complete URL with encoded medicine name
 */
export const generatePharmacySearchUrl = (
  pharmacy: PharmacyLink,
  medicineName: string
): string => {
  const encodedName = encodeURIComponent(medicineName.trim());
  return `${pharmacy.baseUrl}${encodedName}`;
};

/**
 * Generate Google Maps search URL for nearby pharmacies
 * @param latitude - Current latitude (optional)
 * @param longitude - Current longitude (optional)
 * @returns Google Maps URL for pharmacy search
 */
export const generateNearbyPharmaciesUrl = (
  latitude?: number,
  longitude?: number
): string => {
  if (latitude && longitude) {
    // Search near specific location
    return `https://www.google.com/maps/search/pharmacy+near+me/@${latitude},${longitude},15z`;
  }
  // Use device location
  return 'https://www.google.com/maps/search/pharmacy+near+me';
};

/**
 * Generate Google Maps directions URL to a pharmacy
 * @param pharmacyAddress - Address or name of the pharmacy
 * @param latitude - Current latitude (optional)
 * @param longitude - Current longitude (optional)
 * @returns Google Maps URL for directions
 */
export const generatePharmacyDirectionsUrl = (
  pharmacyAddress: string,
  latitude?: number,
  longitude?: number
): string => {
  const encodedAddress = encodeURIComponent(pharmacyAddress);
  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/${latitude},${longitude}/${encodedAddress}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
};
