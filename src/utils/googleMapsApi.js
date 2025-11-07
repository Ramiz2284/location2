const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export async function getCoordsByAddress(address) {
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
		address
	)}&key=${GOOGLE_MAPS_API_KEY}`
	const response = await fetch(url)
	const data = await response.json()
	if (data.status === 'OK' && data.results.length > 0) {
		const loc = data.results[0].geometry.location
		return { lat: loc.lat, lng: loc.lng }
	}
	return null
}

export async function getCoordsByPlaceId(placeId) {
	// ✅ Используем Geocoding API вместо Places API (работает с фронтенда)
	const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
	const response = await fetch(url)
	const data = await response.json()
	if (data.status === 'OK' && data.results.length > 0) {
		const loc = data.results[0].geometry.location
		return { lat: loc.lat, lng: loc.lng }
	}
	console.error('getCoordsByPlaceId error:', data.status, data)
	return null
}
