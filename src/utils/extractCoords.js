import { getCoordsByPlaceId } from './googleMapsApi'

// Показываем алерт (для мобильного без DevTools) и логируем в консоль
function notifyError(msg, detail) {
	console.warn('[coords:error]', msg, detail || '')
	// Убираем alert отсюда — будем показывать только в конце
}

async function extractCoordsFromShortLink(shortLink) {
	return new Promise(resolve => {
		// Открываем ссылку в новом окне (минимальные размеры)
		const popup = window.open(
			shortLink,
			'_blank',
			'width=1,height=1,left=-999,top=-999'
		)
		let resolved = false

		// Функция для очистки
		const cleanup = () => {
			if (popup && !popup.closed) popup.close()
			clearInterval(checkInterval)
			if (!resolved) {
				resolved = true
				resolve(null)
			}
		}

		// Слушаем изменения URL в новом окне
		const checkInterval = setInterval(() => {
			try {
				if (!popup || popup.closed) {
					cleanup()
					return
				}
				let currentUrl
				try {
					currentUrl = popup.location.href
				} catch (e) {
					// Игнорируем ошибки доступа к cross-origin URL
				}
				if (
					currentUrl &&
					currentUrl !== shortLink &&
					currentUrl !== 'about:blank'
				) {
					cleanup()
					resolved = true
					// Пытаемся извлечь координаты из полного URL
					const coords = extractCoordsFromRegularLink(currentUrl)
					resolve(coords)
				}
			} catch (e) {
				// Игнорируем ошибки
			}
		}, 100)

		// Таймаут через 10 секунд
		setTimeout(() => {
			cleanup()
		}, 10000)
	})
}

export async function extractCoordsFromLink(link) {
	console.log('extractCoordsFromLink: входная строка', link)

	if (!link || link.length < 5) {
		notifyError(
			'Пустая или слишком короткая строка. Вставь ссылку Google Maps.'
		)
		return null
	}

	// Быстрая проверка формата
	if (!/(google\.com\/maps|maps\.app\.goo\.gl)/i.test(link)) {
		notifyError(
			'Это не похоже на ссылку Google Maps. Открой точку в картах и скопируй ссылку заново.'
		)
		// Не прерываем — вдруг это адрес (улица, город) и удастся геокодировать
	}

	// 1. Если это короткая ссылка Google Maps — раскрываем через serverless-функцию
	if (link.includes('maps.app.goo.gl/')) {
		try {
			const fullUrl = await unshortenGoogleLink(link)
			console.log('unshortenGoogleLink:', fullUrl)
			if (!fullUrl) {
				notifyError(
					'Не удалось раскрыть короткую ссылку maps.app.goo.gl. Попробуй открыть её вручную и скопировать длинную.'
				)
				// Fallback через iframe
				const iframeCoords = await tryExtractViaIframe(link)
				if (iframeCoords) return iframeCoords
				// Если не удалось — возвращаем null
				return null
			}
			// Fallback: попытка раскрыть короткую ссылку через iframe и получить document.referrer
			async function tryExtractViaIframe(shortLink) {
				return new Promise(resolve => {
					let done = false
					const iframe = document.createElement('iframe')
					iframe.style.width = '1px'
					iframe.style.height = '1px'
					iframe.style.position = 'absolute'
					iframe.style.left = '-9999px'
					iframe.style.top = '-9999px'
					iframe.src = shortLink
					document.body.appendChild(iframe)

					function cleanup() {
						if (iframe && iframe.parentNode)
							iframe.parentNode.removeChild(iframe)
						done = true
					}

					let tries = 0
					const maxTries = 30 // ~3 секунды
					const interval = setInterval(() => {
						tries++
						try {
							// Иногда document.referrer становится доступен
							const ref = iframe.contentWindow.document.referrer
							if (ref && ref !== shortLink && ref !== 'about:blank') {
								cleanup()
								clearInterval(interval)
								// Пытаемся извлечь координаты из реферера
								const coords = extractCoordsFromRegularLink(ref)
								if (coords) {
									resolve(coords)
									return
								}
							}
						} catch (e) {
							// cross-origin, игнорируем
						}
						if (tries >= maxTries) {
							cleanup()
							clearInterval(interval)
							resolve(null)
						}
					}, 100)
				})
			}

			// Популярные обёртки: https://www.google.com/url?...&q=<inner> или &url=&link=
			try {
				const u = new URL(fullUrl)
				const wrapped =
					u.searchParams.get('q') ||
					u.searchParams.get('url') ||
					u.searchParams.get('link')
				if (wrapped) {
					const inner = decodeURIComponent(wrapped)
					console.log('unwrap from finalUrl:', inner)
					// 1) Пытаемся как place_id (place_id допустим, он встроен в ссылку)
					const innerPlaceId = inner.match(/placeid=([^&]+)/i)
					if (innerPlaceId) {
						const innerPlaceCoords = await getCoordsByPlaceId(innerPlaceId[1])
						if (innerPlaceCoords) return innerPlaceCoords
					}
					// 2) Пробуем извлечь координаты напрямую из URL
					const innerCoords = extractCoordsFromRegularLink(inner)
					if (innerCoords) return innerCoords
					// 3) Пробуем serverless resolve (HTML/parsing) без текстового геокодирования
					const innerResolved = await resolveLinkForCoords(inner)
					if (innerResolved) return innerResolved
				}
			} catch (_) {}
			// 1.1. Сначала ищем placeId
			const placeIdMatch = fullUrl.match(/placeid=([^&]+)/i)
			if (placeIdMatch) {
				const placeCoords = await getCoordsByPlaceId(placeIdMatch[1])
				console.log('getCoordsByPlaceId (после unshorten):', placeCoords)
				if (placeCoords) return placeCoords
				notifyError(
					'place_id найден, но координаты не получены (Geocoding API вернул пусто).'
				)
			}
			// 1.2. Потом ищем координаты
			const coords = extractCoordsFromRegularLink(fullUrl)
			console.log('extractCoordsFromRegularLink (после unshorten):', coords)
			if (coords) return coords
			// 1.3. Serverless resolve (парсинг embed / финального URL)
			const resolvedCoords = await resolveLinkForCoords(fullUrl)
			console.log('resolveLinkForCoords (после unshorten):', resolvedCoords)
			if (resolvedCoords) return resolvedCoords
			notifyError(
				'Не удалось извлечь координаты из раскрытой ссылки (link-only режим). Скопируй точку из Google Maps ещё раз.'
			)
			return null
		} catch (e) {
			console.log('Ошибка при раскрытии короткой ссылки:', e)
			notifyError(
				'Ошибка при работе с короткой ссылкой (возможно блокировка всплывающих окон). Открой ссылку вручную и скопируй из адресной строки.'
			)
			return null
		}
	}

	// 2. Для обычных ссылок — сначала ищем placeId
	const placeIdMatch = link.match(/placeid=([^&]+)/i)
	if (placeIdMatch) {
		const placeCoords = await getCoordsByPlaceId(placeIdMatch[1])
		console.log('getCoordsByPlaceId:', placeCoords)
		if (placeCoords) return placeCoords
		notifyError(
			'place_id найден, но координаты не получены. Возможно ограничения API или неверный ключ.'
		)
	}

	// 2.5. Проверяем ftid (feature ID) - используется в некоторых ссылках Google Maps
	const ftidMatch = link.match(/[?&]ftid=([^&]+)/i)
	if (ftidMatch) {
		// ftid это base64 encoded place_id, можно попробовать декодировать
		// Или просто используем как есть через Geocoding API с адресом из q
		console.log('Найден ftid:', ftidMatch[1])
	}

	// 3. Потом координаты напрямую
	const coords = extractCoordsFromRegularLink(link)
	console.log('extractCoordsFromRegularLink:', coords)
	if (coords) return coords

	// 4. Если есть параметр q, НЕ геокодируем текст — пробуем только serverless resolve
	try {
		const url = new URL(link)
		const qParam = url.searchParams.get('q')
		if (qParam) {
			console.log(
				'Найден параметр q (link-only режим, без геокодирования):',
				qParam
			)
			const resolvedFromQ = await resolveLinkForCoords(link)
			if (resolvedFromQ) {
				console.log('resolveLinkForCoords (из q):', resolvedFromQ)
				return resolvedFromQ
			}
		}
	} catch (e) {
		console.log('Ошибка при проверке параметра q:', e)
	}

	// 5. Финальный fallback: serverless resolve ещё раз (на случай отсутствия q)
	const finalResolved = await resolveLinkForCoords(link)
	if (finalResolved) {
		console.log('resolveLinkForCoords (final fallback):', finalResolved)
		return finalResolved
	}

	// 6. Последний fallback: если есть параметр q — пробуем геокодирование через Maps JS API Geocoder
	try {
		const url = new URL(link)
		const qParam = url.searchParams.get('q')
		if (qParam && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(qParam)) {
			// q не является координатами "lat,lng" — пробуем как адрес
			console.log(
				'Найден текстовый q, пробуем geocodeAddress (Maps JS API):',
				qParam
			)
			const geocoded = await geocodeAddress(decodeURIComponent(qParam))
			if (geocoded) {
				console.log('geocodeAddress успешно:', geocoded)
				return geocoded
			}
		}
	} catch (e) {
		console.log('Ошибка при финальном geocode:', e)
	}

	notifyError(
		'Не удалось получить координаты в link-only режиме. Проверь: открой точку Google Maps, скопируй именно адрес страницы места (с !3d...!4d...).'
	)
	return null
}

// Функция для извлечения координат из обычной (не короткой) ссылки
function extractCoordsFromRegularLink(link) {
	try {
		console.log('extractCoordsFromRegularLink: парсим', link)
		const url = new URL(link)
		for (const [key, value] of url.searchParams.entries()) {
			const coordMatch = value.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)
			if (coordMatch) {
				console.log(
					'extractCoordsFromRegularLink: найдено в параметрах',
					coordMatch
				)
				return {
					lat: parseFloat(coordMatch[1]),
					lng: parseFloat(coordMatch[2]),
				}
			}
		}
		const pathMatch = url.pathname.match(/[!@]?(-?\d+\.\d+),(-?\d+\.\d+)/)
		if (pathMatch) {
			console.log('extractCoordsFromRegularLink: найдено в path', pathMatch)
			return {
				lat: parseFloat(pathMatch[1]),
				lng: parseFloat(pathMatch[2]),
			}
		}
		const patterns = [
			/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dLAT!4dLNG format — ТОЧНОЕ МЕСТО!
			/q=(-?\d+\.\d+),(-?\d+\.\d+)/, // q parameter
			/ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // ll parameter
			/place\/.*?@(-?\d+\.\d+),(-?\d+\.\d+)/, // place format
			/dir\/.*?@(-?\d+\.\d+),(-?\d+\.\d+)/, // directions format
			// /@(-?\d+\.\d+),(-?\d+\.\d+)/ — УБИРАЕМ! Это центр карты, а не место
		]
		for (const pattern of patterns) {
			const match = link.match(pattern)
			if (match) {
				console.log(
					'extractCoordsFromRegularLink: найдено по паттерну',
					pattern,
					match
				)
				return {
					lat: parseFloat(match[1]),
					lng: parseFloat(match[2]),
				}
			}
		}
		const coordParams = [
			'query',
			'destination',
			'origin',
			'center',
			'location',
			'daddr',
			'saddr',
		]
		for (const param of coordParams) {
			if (url.searchParams.has(param)) {
				const val = url.searchParams.get(param)
				if (!val) continue
				const coordMatch = val.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)
				if (coordMatch) {
					console.log(
						'extractCoordsFromRegularLink: найдено в',
						param,
						coordMatch
					)
					return {
						lat: parseFloat(coordMatch[1]),
						lng: parseFloat(coordMatch[2]),
					}
				}
				const parts = val.split(',').map(part => part.trim())
				if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
					console.log(
						'extractCoordsFromRegularLink: найдено как две цифры',
						parts
					)
					return {
						lat: parseFloat(parts[0]),
						lng: parseFloat(parts[1]),
					}
				}
			}
		}
	} catch (e) {
		console.log('extractCoordsFromRegularLink: ошибка', e)
	}
	return null
}

export async function unshortenGoogleLink(shortUrl) {
	const apiUrl = `/api/unshorten?url=${encodeURIComponent(shortUrl)}`
	const response = await fetch(apiUrl)
	const data = await response.json()
	return data.finalUrl // это уже длинная ссылка Google Maps
}

// Serverless link-only resolver (парсит конечный URL и embed HTML)
async function resolveLinkForCoords(originalLink) {
	try {
		const apiUrl = `/api/resolve?url=${encodeURIComponent(originalLink)}`
		const response = await fetch(apiUrl)
		if (!response.ok) {
			console.log('resolveLinkForCoords: response not ok', response.status)
			return null
		}
		const data = await response.json()
		if (data && data.coords) {
			return data.coords
		}
		console.log('resolveLinkForCoords: нет coords в ответе', data)
		return null
	} catch (e) {
		console.log('resolveLinkForCoords: ошибка', e)
		return null
	}
}
