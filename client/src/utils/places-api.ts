// Google Places API utility for real address autocomplete
import { HATTIESBURG_CENTER } from './hattiesburg-locations';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GeocodingResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// Function to get place predictions using Google Places Autocomplete API
export const getPlacePredictions = async (input: string): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !input.trim()) return [];

  try {
    const service = new (window as any).google.maps.places.AutocompleteService();
    
    return new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: input.trim(),
          location: new (window as any).google.maps.LatLng(HATTIESBURG_CENTER.lat, HATTIESBURG_CENTER.lng),
          radius: 24140, // 15 miles in meters
          componentRestrictions: { country: 'us' },
          types: ['geocode', 'establishment']
        },
        (predictions: PlacePrediction[] | null, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestions = predictions.slice(0, 5).map(p => p.description);
            resolve(suggestions);
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error('Places API error:', error);
    return [];
  }
};

// Function to geocode an address to get coordinates
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !address.trim()) return null;

  try {
    const geocoder = new (window as any).google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode(
        { address: address.trim() },
        (results: GeocodingResult[], status: any) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            resolve({
              lat: (location as any).lat() || (location as any).lat,
              lng: (location as any).lng() || (location as any).lng
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Function to check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return !!(window as any).google && !!(window as any).google.maps && !!(window as any).google.maps.places;
};

// Fallback to Mississippi locations when Google API is not available
import { ALL_LOCATIONS } from './hattiesburg-locations';

export const getFallbackSuggestions = (input: string): string[] => {
  if (!input.trim()) return [];
  return ALL_LOCATIONS
    .filter(location => 
      location.name.toLowerCase().includes(input.toLowerCase()) ||
      location.address.toLowerCase().includes(input.toLowerCase())
    )
    .slice(0, 5)
    .map(location => location.address);
};