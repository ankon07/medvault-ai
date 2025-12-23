/**
 * MediVault AI - Google Search Service
 * Integration with Google Custom Search API for medicine pricing
 */

const GOOGLE_API_KEY = 'AIzaSyB_84_if8vvdakQCl0dry_lshvPOnaLQMw';
const SEARCH_ENGINE_ID = '270a36c5c0d4f4396';

export interface MedicineSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  image?: string;
}

export interface MedicinePriceInfo {
  name: string;
  sources: MedicineSearchResult[];
  suggestedPrice?: string;
  image?: string;
}

/**
 * Search for medicine pricing information using Google Custom Search API
 * @param medicineName - Name of the medicine to search
 * @returns Promise resolving to search results
 */
export const searchMedicinePricing = async (
  medicineName: string
): Promise<MedicinePriceInfo> => {
  try {
    // Build search query for Bangladesh medicine pricing
    const query = encodeURIComponent(`${medicineName} price Bangladesh pharmacy`);
    
    // Google Custom Search API endpoint
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&num=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse results
    const results: MedicineSearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src,
    }));
    
    return {
      name: medicineName,
      sources: results,
      image: results[0]?.image,
    };
  } catch (error) {
    console.error('Error searching medicine pricing:', error);
    throw new Error('Failed to search for medicine pricing. Please check your internet connection.');
  }
};

/**
 * Search for medicine on specific pharmacy website
 * @param medicineName - Name of the medicine
 * @param pharmacyDomain - Domain of the pharmacy (e.g., 'arogga.com')
 * @returns Promise resolving to search results
 */
export const searchMedicineOnPharmacy = async (
  medicineName: string,
  pharmacyDomain: string
): Promise<MedicineSearchResult[]> => {
  try {
    const query = encodeURIComponent(`${medicineName} site:${pharmacyDomain}`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&num=3`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return (data.items || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      image: item.pagemap?.cse_image?.[0]?.src,
    }));
  } catch (error) {
    console.error('Error searching pharmacy:', error);
    return [];
  }
};

/**
 * Extract price from search result snippet
 * @param snippet - Search result snippet text
 * @returns Extracted price or null
 */
export const extractPriceFromSnippet = (snippet: string): string | null => {
  // Try to find price patterns in BDT
  const patterns = [
    /৳\s*(\d+(?:,\d+)?(?:\.\d+)?)/,  // ৳150 or ৳1,500
    /BDT\s*(\d+(?:,\d+)?(?:\.\d+)?)/i,  // BDT 150
    /Tk\.?\s*(\d+(?:,\d+)?(?:\.\d+)?)/i,  // Tk. 150
    /Price:?\s*৳?\s*(\d+(?:,\d+)?(?:\.\d+)?)/i,  // Price: 150
  ];
  
  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match) {
      return `৳${match[1]}`;
    }
  }
  
  return null;
};

export default {
  searchMedicinePricing,
  searchMedicineOnPharmacy,
  extractPriceFromSnippet,
};
