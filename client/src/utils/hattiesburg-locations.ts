// Hattiesburg, MS specific locations and coordinates
export const HATTIESBURG_CENTER = {
  lat: 31.3271,
  lng: -89.2903
};

export const HATTIESBURG_LOCATIONS = [
  {
    name: "University of Southern Mississippi",
    address: "118 College Dr, Hattiesburg, MS 39406",
    coordinates: { lat: 31.3307, lng: -89.3378 },
    type: "university"
  },
  {
    name: "Downtown Hattiesburg",
    address: "200 Forrest St, Hattiesburg, MS 39401",
    coordinates: { lat: 31.3271, lng: -89.2903 },
    type: "downtown"
  },
  {
    name: "Turtle Creek Mall",
    address: "1000 Turtle Creek Dr, Hattiesburg, MS 39402",
    coordinates: { lat: 31.3196, lng: -89.3514 },
    type: "shopping"
  },
  {
    name: "Forrest General Hospital",
    address: "6051 US-49, Hattiesburg, MS 39401",
    coordinates: { lat: 31.3644, lng: -89.3375 },
    type: "hospital"
  },
  {
    name: "Hattiesburg-Laurel Regional Airport",
    address: "50 Terminal Dr, Moselle, MS 39459",
    coordinates: { lat: 31.2647, lng: -89.2528 },
    type: "airport"
  },
  {
    name: "Walmart Supercenter (Hardy St)",
    address: "6072 US-49, Hattiesburg, MS 39401",
    coordinates: { lat: 31.3667, lng: -89.3369 },
    type: "shopping"
  },
  {
    name: "Walmart Supercenter (Lincoln Rd)",
    address: "4600 Lincoln Rd Ext, Hattiesburg, MS 39402",
    coordinates: { lat: 31.2978, lng: -89.3819 },
    type: "shopping"
  },
  {
    name: "Hattiesburg Station",
    address: "308 Newman St, Hattiesburg, MS 39401",
    coordinates: { lat: 31.3251, lng: -89.2867 },
    type: "transportation"
  },
  {
    name: "Westland Plaza",
    address: "1000 Westland Plaza, West Hattiesburg, MS 39401",
    coordinates: { lat: 31.3189, lng: -89.3667 },
    type: "shopping"
  },
  {
    name: "Methodist Rehabilitation Center",
    address: "1350 Broad St, Hattiesburg, MS 39402",
    coordinates: { lat: 31.3203, lng: -89.2803 },
    type: "hospital"
  }
];

export const getHattiesburgLocationByName = (name: string) => {
  return HATTIESBURG_LOCATIONS.find(location => 
    location.name.toLowerCase().includes(name.toLowerCase())
  );
};

export const getNearbyLocations = (coordinates: { lat: number; lng: number }, radiusMiles: number = 5) => {
  return HATTIESBURG_LOCATIONS.filter(location => {
    const distance = calculateDistance(coordinates, location.coordinates);
    return distance <= radiusMiles;
  });
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const isWithinHattiesburgArea = (coordinates: { lat: number; lng: number }): boolean => {
  const distance = calculateDistance(coordinates, HATTIESBURG_CENTER);
  return distance <= 15; // 15 mile radius from downtown
};