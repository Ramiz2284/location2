// Используем встроенный Geocoder из Maps JavaScript API вместо прямых HTTP-запросов.
// Это безопаснее и правильнее для клиентских приложений.

// Геокодирование адреса через window.google.maps.Geocoder (fallback для q=... параметра)
export async function geocodeAddress(address) {
	if (!address || typeof address !== 'string') {
		return null
	}
	if (!window.google?.maps?.Geocoder) {
		console.warn('[geocodeAddress] Google Maps API не загружен')
		alert('❌ Google Maps API не загружен. Подожди загрузки карты.')
		return null
	}

	const geocoder = new window.google.maps.Geocoder()

	return new Promise(resolve => {
		console.log('[geocodeAddress] Запрос:', address)
		geocoder.geocode({ address }, (results, status) => {
			const debugInfo = {
				status,
				resultsCount: results?.length || 0,
				firstResult: results?.[0]
					? {
							formatted_address: results[0].formatted_address,
							place_id: results[0].place_id,
							location: results[0].geometry?.location
								? {
										lat: results[0].geometry.location.lat(),
										lng: results[0].geometry.location.lng(),
								  }
								: null,
							types: results[0].types,
					  }
					: null,
			}

			console.log('[geocodeAddress] Ответ:', debugInfo)

			if (status === 'OK' && results?.[0]?.geometry?.location) {
				const loc = results[0].geometry.location
				const coords = { lat: loc.lat(), lng: loc.lng() }
				console.log('[geocodeAddress] ✅ Успех:', coords)
				resolve(coords)
			} else {
				console.warn('[geocodeAddress] ❌ Провал:', status)
				if (status !== 'OK' && status !== 'ZERO_RESULTS') {
					const errorMessages = {
						OVER_QUERY_LIMIT: 'Превышен лимит запросов Geocoding API',
						REQUEST_DENIED:
							'Доступ к Geocoding API запрещён (проверь API ключ и ограничения)',
						INVALID_REQUEST: 'Некорректный запрос к Geocoding API',
						UNKNOWN_ERROR: 'Неизвестная ошибка Geocoding API',
					}
					alert(`❌ Ошибка геокодирования:\n${errorMessages[status] || status}`)
				}
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
