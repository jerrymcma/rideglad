const API_BASE_URL = 'https://3721f565-a1d8-4159-b35e-5adb9d86c8e7-00-18tjsnx403r58.kirk.replit.dev';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Trip {
  id: string;
  riderId: string;
  driverId?: string;
  pickupAddress: string;
  destinationAddress: string;
  status: 'pending' | 'matched' | 'pickup' | 'inprogress' | 'completed' | 'cancelled';
  estimatedPrice: string;
  finalPrice?: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  totalRatings: number;
  isActive: boolean;
}

class ApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for session cookies
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.fetchWithAuth('/api/auth/user');
    } catch {
      return null;
    }
  }

  // Trip methods
  async createTrip(tripData: {
    pickupAddress: string;
    destinationAddress: string;
    pickupLat: number;
    pickupLng: number;
    destinationLat: number;
    destinationLng: number;
  }): Promise<Trip> {
    return this.fetchWithAuth('/api/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  async getActiveTrip(): Promise<Trip | null> {
    try {
      return await this.fetchWithAuth('/api/trips/active');
    } catch {
      return null;
    }
  }

  async getTripById(tripId: string): Promise<Trip> {
    return this.fetchWithAuth(`/api/trips/${tripId}`);
  }

  async completeTrip(tripId: string): Promise<Trip> {
    return this.fetchWithAuth(`/api/trips/${tripId}/complete`, {
      method: 'PATCH',
    });
  }

  // Driver methods
  async getActiveDrivers(): Promise<Driver[]> {
    return this.fetchWithAuth('/api/drivers/active');
  }

  // Rating methods
  async submitRating(tripId: string, rating: number, comment?: string): Promise<void> {
    await this.fetchWithAuth('/api/ratings', {
      method: 'POST',
      body: JSON.stringify({
        tripId,
        rating,
        comment,
      }),
    });
  }

  // Location methods
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    // This would typically use Google Maps API or similar
    // For now, return a placeholder
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    // This would typically use Google Maps API or similar
    // For now, return placeholder coordinates
    const hattiesburg = { lat: 31.3271, lng: -89.2903 };
    const germantown = { lat: 35.0868, lng: -89.8101 };
    const nashville = { lat: 36.1627, lng: -86.7816 };
    
    const lowerAddress = address.toLowerCase();
    if (lowerAddress.includes('germantown') || lowerAddress.includes('memphis')) {
      return germantown;
    } else if (lowerAddress.includes('nashville')) {
      return nashville;
    } else {
      return hattiesburg;
    }
  }
}

export const apiService = new ApiService();
export type { User, Trip, Driver };