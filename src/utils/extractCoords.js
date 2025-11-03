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
	// 1. Обычные ссылки — старый парсер
	const coords = extractCoordsFromRegularLink(link)
	if (coords) return coords

	// 2. Если не нашли — пробуем как адрес (или короткая ссылка)
	return await getCoordsByAddress(link)
}

// Функция для извлечения координат из обычной (не короткой) ссылки
function extractCoordsFromRegularLink(link) {
	try {
		// 1) Ищем координаты в любых параметрах URL
		const url = new URL(link)

		// Проверяем все параметры URL на наличие координат
		for (const [key, value] of url.searchParams.entries()) {
			const coordMatch = value.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)
			if (coordMatch) {
				return {
					lat: parseFloat(coordMatch[1]),
					lng: parseFloat(coordMatch[2]),
				}
			}
		}

		// Проверяем путь URL на наличие координат (включая @ и другие маркеры)
		const pathMatch = url.pathname.match(/[!@]?(-?\d+\.\d+),(-?\d+\.\d+)/)
		if (pathMatch) {
			return {
				lat: parseFloat(pathMatch[1]),
				lng: parseFloat(pathMatch[2]),
			}
		}

		// 2) Проверяем стандартные форматы Google Maps
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
				return {
					lat: parseFloat(match[1]),
					lng: parseFloat(match[2]),
				}
			}
		}

		// 3) Проверяем параметры с координатами
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

				// Пробуем найти координаты в значении параметра
				const coordMatch = val.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)
				if (coordMatch) {
					return {
						lat: parseFloat(coordMatch[1]),
						lng: parseFloat(coordMatch[2]),
					}
				}

				// Проверяем, не являются ли значением просто две цифры через запятую
				const parts = val.split(',').map(part => part.trim())
				if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
					return {
						lat: parseFloat(parts[0]),
						lng: parseFloat(parts[1]),
					}
				}
			}
		}
	} catch (e) {
		console.log('Error parsing regular link:', e)
	}
	return null
}
