import { getCoordsByAddress } from './googleMapsApi'

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

	// 1. Если это короткая ссылка Google Maps — раскрываем через serverless-функцию
	if (link.includes('maps.app.goo.gl/')) {
		try {
			const fullUrl = await unshortenGoogleLink(link)
			console.log('unshortenGoogleLink:', fullUrl)
			if (fullUrl) {
				const coords = extractCoordsFromRegularLink(fullUrl)
				console.log('extractCoordsFromRegularLink (после unshorten):', coords)
				if (coords) return coords
				// Если не нашли — пробуем как адрес
				const apiCoords = await getCoordsByAddress(fullUrl)
				console.log('getCoordsByAddress (после unshorten):', apiCoords)
				return apiCoords
			}
		} catch (e) {
			console.log('Ошибка при раскрытии короткой ссылки:', e)
		}
	}

	// 2. Обычные ссылки — старый парсер
	const coords = extractCoordsFromRegularLink(link)
	console.log('extractCoordsFromRegularLink:', coords)
	if (coords) return coords

	// 3. Если не нашли — пробуем как адрес (или короткая ссылка)
	const apiCoords = await getCoordsByAddress(link)
	console.log('getCoordsByAddress:', apiCoords)
	return apiCoords
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
			/q=(-?\d+\.\d+),(-?\d+\.\d+)/, // q parameter
			/ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // ll parameter
			/(@|-?\d+\.\d+),(-?\d+\.\d+)/, // @ format
			/\/(-?\d+\.\d+),(-?\d+\.\d+)/, // path format
			/place\/.*?@(-?\d+\.\d+),(-?\d+\.\d+)/, // place format
			/dir\/.*?@(-?\d+\.\d+),(-?\d+\.\d+)/, // directions format
			/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dLAT!4dLNG format
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
