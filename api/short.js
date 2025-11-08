// Serverless endpoint: принимает токен t (base64url "lat,lng") и редиректит на полноформатную ссылку Google Maps
// Пример: /api/short?t=... -> 302 https://www.google.com/maps/@lat,lng,18z

export default async function handler(req, res) {
	const { t } = req.query
	if (!t) {
		res.status(400).json({ error: 'Missing token t' })
		return
	}
	try {
		// Декодируем base64url
		const padLen = (4 - (t.length % 4)) % 4
		const base64 = (t + '='.repeat(padLen))
			.replace(/-/g, '+')
			.replace(/_/g, '/')
		const raw = Buffer.from(base64, 'base64').toString('utf8')
		const [latStr, lngStr] = raw.split(',')
		const lat = parseFloat(latStr)
		const lng = parseFloat(lngStr)
		if (!isFinite(lat) || !isFinite(lng)) {
			res.status(400).json({ error: 'Invalid coords in token' })
			return
		}
		const mapUrl = `https://www.google.com/maps/@${lat},${lng},18z`
		res.writeHead(302, { Location: mapUrl })
		res.end()
	} catch (e) {
		res.status(400).json({ error: 'Bad token format' })
	}
}
