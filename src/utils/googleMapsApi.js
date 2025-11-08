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

// 🔍 Поиск по тексту (название, адрес) через Places Text Search API (new)
// Док: https://developers.google.com/maps/documentation/places/web-service/search-text
export async function getCoordsByTextQuery(query) {
	try {
		const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
			query
		)}&key=${GOOGLE_MAPS_API_KEY}`
		const resp = await fetch(url)
		const data = await resp.json()
		if (data.status === 'OK' && data.results && data.results.length > 0) {
			const first = data.results[0]
			if (first.geometry && first.geometry.location) {
				const loc = first.geometry.location
				return { lat: loc.lat, lng: loc.lng }
			}
		}
		console.warn(
			'getCoordsByTextQuery no results:',
			data.status,
			data.error_message
		)
		return null
	} catch (e) {
		console.error('getCoordsByTextQuery exception:', e)
		return null
	}
}
