// Простое кодирование координат в компактный токен base64url: "lat,lng"
// Используем только фронтенд (браузерную) реализацию

function toBase64Url(str) {
	// Кодируем в UTF-8 и затем в base64, приводим к URL-safe
	const utf8 = new TextEncoder().encode(str)
	let binary = ''
	for (let i = 0; i < utf8.length; i++) binary += String.fromCharCode(utf8[i])
	const b64 = btoa(binary)
	return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function encodeCoords(coords) {
	if (!coords || !isFinite(coords.lat) || !isFinite(coords.lng)) return null
	const payload = `${coords.lat},${coords.lng}`
	return toBase64Url(payload)
}

// Опционально оставим декодер для возможных внутренних нужд/тестов (не используется в UI)
export function decodeToken(token) {
	try {
		if (!token) return null
		const padLen = (4 - (token.length % 4)) % 4
		const base64 = (token + '='.repeat(padLen))
			.replace(/-/g, '+')
			.replace(/_/g, '/')
		const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
		const text = new TextDecoder().decode(bytes)
		const [latStr, lngStr] = text.split(',')
		const lat = parseFloat(latStr)
		const lng = parseFloat(lngStr)
		if (!isFinite(lat) || !isFinite(lng)) return null
		return { lat, lng }
	} catch {
		return null
	}
}
