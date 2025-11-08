const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Оставляем только функцию по place_id (Geocoding API). Адресный и текстовый поиск удалены (link-only режим).
export async function getCoordsByPlaceId(placeId) {
	if (!placeId) return null
	try {
		const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
		const response = await fetch(url)
		const data = await response.json()
		if (data.status === 'OK' && data.results.length > 0) {
			const loc = data.results[0].geometry.location
			return { lat: loc.lat, lng: loc.lng }
		}
		console.warn(
			'getCoordsByPlaceId no results:',
			data.status,
			data.error_message
		)
		return null
	} catch (e) {
		console.error('getCoordsByPlaceId exception:', e)
		return null
	}
}
