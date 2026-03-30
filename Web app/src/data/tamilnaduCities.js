/**
 * tamilnaduCities.js
 *
 * Static list of all Tamil Nadu cities used for delivery location autocomplete.
 * Sourced directly from cities.csv in the backend.
 * Using local data ensures:
 *  - Zero latency autocomplete
 *  - Strict Tamil Nadu restriction (no global city bleed-through)
 *  - No external API key required
 */

export const TAMIL_NADU_CITIES = [
  { city: "Chennai",         lat: 13.0827, lon: 80.2707 },
  { city: "Coimbatore",      lat: 11.0168, lon: 76.9558 },
  { city: "Madurai",         lat: 9.9252,  lon: 78.1198 },
  { city: "Salem",           lat: 11.6643, lon: 78.1460 },
  { city: "Tiruchirappalli", lat: 10.7905, lon: 78.7047 },
  { city: "Tirunelveli",     lat: 8.7139,  lon: 77.7567 },
  { city: "Erode",           lat: 11.3410, lon: 77.7172 },
  { city: "Vellore",         lat: 12.9165, lon: 79.1325 },
  { city: "Thoothukudi",     lat: 8.7642,  lon: 78.1348 },
  { city: "Thanjavur",       lat: 10.7870, lon: 79.1378 },
  { city: "Dindigul",        lat: 10.3624, lon: 77.9695 },
  { city: "Karur",           lat: 10.9601, lon: 78.0766 },
  { city: "Namakkal",        lat: 11.2189, lon: 78.1674 },
  { city: "Krishnagiri",     lat: 12.5186, lon: 78.2137 },
  { city: "Cuddalore",       lat: 11.7480, lon: 79.7714 },
  { city: "Nagapattinam",    lat: 10.7672, lon: 79.8449 },
  { city: "Kanyakumari",     lat: 8.0883,  lon: 77.5385 },
  { city: "Ramanathapuram",  lat: 9.3639,  lon: 78.8395 },
  { city: "Sivagangai",      lat: 10.0268, lon: 78.4819 },
  { city: "Virudhunagar",    lat: 9.5851,  lon: 77.9527 },
  { city: "Dharmapuri",      lat: 12.1211, lon: 78.1582 },
  { city: "Perambalur",      lat: 11.2320, lon: 78.8800 },
  { city: "Ariyalur",        lat: 11.1400, lon: 79.0800 },
  { city: "Pudukkottai",     lat: 10.3833, lon: 78.8001 },
  { city: "Tiruvallur",      lat: 13.1431, lon: 79.9087 },
  { city: "Kancheepuram",    lat: 12.8342, lon: 79.7036 },
  { city: "Villupuram",      lat: 11.9401, lon: 79.4861 },
  { city: "Tiruvannamalai",  lat: 12.2253, lon: 79.0747 },
  { city: "Tenkasi",         lat: 8.9604,  lon: 77.3152 },
  { city: "Nilgiris",        lat: 11.4102, lon: 76.6950 },
  { city: "Mayiladuthurai",  lat: 11.1018, lon: 79.6491 },
  { city: "Chengalpattu",    lat: 12.6819, lon: 79.9888 },
  { city: "Ranipet",         lat: 12.9321, lon: 79.3325 },
  { city: "Tirupattur",      lat: 12.4970, lon: 78.5730 },
  { city: "Kallakurichi",    lat: 11.7383, lon: 78.9608 },
  { city: "Thiruvarur",      lat: 10.7713, lon: 79.6370 },
  { city: "Hosur",           lat: 12.7409, lon: 77.8253 },
];

/**
 * Filter cities by search query (case-insensitive prefix/contains match).
 * Returns up to `limit` results.
 */
export function searchCities(query, limit = 6) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  return TAMIL_NADU_CITIES.filter((c) =>
    c.city.toLowerCase().includes(q)
  ).slice(0, limit);
}
