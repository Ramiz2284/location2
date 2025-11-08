// Используем встроенный Geocoder из Maps JavaScript API вместо прямых HTTP-запросов.
// Это безопаснее и правильнее для клиентских приложений.

// Геокодирование адреса через window.google.maps.Geocoder (fallback для q=... параметра)
export async function geocodeAddress(address) {
	if (!address || typeof address !== 'string') return null
	if (!window.google?.maps?.Geocoder) {
		console.warn('[geocodeAddress] Google Maps API not loaded yet')
		return null
	}

	const geocoder = new window.google.maps.Geocoder()

	return new Promise(resolve => {
		geocoder.geocode({ address }, (results, status) => {
			if (status === 'OK' && results?.[0]?.geometry?.location) {
				const loc = results[0].geometry.location
				const coords = { lat: loc.lat(), lng: loc.lng() }
				console.log('[geocodeAddress] success:', address, coords)
				resolve(coords)
			} else {
				console.warn('[geocodeAddress] failed:', status, address)
				resolve(null)
			}
		})
	})
}

// Геокодирование по place_id через window.google.maps.Geocoder
export async function getCoordsByPlaceId(placeId) {
	if (!placeId) return null
	if (!window.google?.maps?.Geocoder) {
		console.warn('[getCoordsByPlaceId] Google Maps API not loaded yet')
		return null
	}

	const geocoder = new window.google.maps.Geocoder()

	return new Promise(resolve => {
		geocoder.geocode({ placeId }, (results, status) => {
			if (status === 'OK' && results?.[0]?.geometry?.location) {
				const loc = results[0].geometry.location
				const coords = { lat: loc.lat(), lng: loc.lng() }
				console.log('[getCoordsByPlaceId] success:', placeId, coords)
				resolve(coords)
			} else {
				console.warn('[getCoordsByPlaceId] failed:', status, placeId)
				resolve(null)
			}
		})
	})
}
