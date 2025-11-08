// Используем встроенный Geocoder из Maps JavaScript API вместо прямых HTTP-запросов.
// Это безопаснее и правильнее для клиентских приложений.

// Геокодирование адреса через window.google.maps.Geocoder (fallback для q=... параметра)
export async function geocodeAddress(address, showDebugAlert = false) {
	if (!address || typeof address !== 'string') {
		if (showDebugAlert) alert('❌ geocodeAddress: пустой адрес')
		return null
	}
	if (!window.google?.maps?.Geocoder) {
		const msg = '❌ Google Maps API не загружен. Подожди загрузки карты.'
		console.warn('[geocodeAddress]', msg)
		if (showDebugAlert) alert(msg)
		return null
	}

	const geocoder = new window.google.maps.Geocoder()

	return new Promise(resolve => {
		console.log('[geocodeAddress] Запрос:', address)
		if (showDebugAlert) {
			alert(`🔍 Геокодирование адреса:\n${address.substring(0, 100)}...`)
		}

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

			if (showDebugAlert) {
				alert(
					`📍 Geocoding API ответ:\n\nСтатус: ${status}\n` +
						`Результатов: ${debugInfo.resultsCount}\n\n` +
						(debugInfo.firstResult
							? `Адрес: ${debugInfo.firstResult.formatted_address}\n` +
							  `Координаты: ${debugInfo.firstResult.location?.lat}, ${debugInfo.firstResult.location?.lng}\n` +
							  `Place ID: ${debugInfo.firstResult.place_id}`
							: 'Нет результатов')
				)
			}

			if (status === 'OK' && results?.[0]?.geometry?.location) {
				const loc = results[0].geometry.location
				const coords = { lat: loc.lat(), lng: loc.lng() }
				console.log('[geocodeAddress] ✅ Успех:', coords)
				resolve(coords)
			} else {
				console.warn('[geocodeAddress] ❌ Провал:', status)
				if (showDebugAlert && status !== 'OK') {
					const errorMessages = {
						ZERO_RESULTS: 'Адрес не найден',
						OVER_QUERY_LIMIT: 'Превышен лимит запросов',
						REQUEST_DENIED: 'Доступ запрещён (проверь API ключ и ограничения)',
						INVALID_REQUEST: 'Некорректный запрос',
						UNKNOWN_ERROR: 'Неизвестная ошибка сервера',
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
