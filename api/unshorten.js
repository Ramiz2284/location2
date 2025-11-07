export default async function handler(req, res) {
	const { url } = req.query
	if (!url) {
		res.status(400).json({ error: 'No url provided' })
		return
	}

	try {
		// Делаем GET с follow и мобильным User-Agent — так maps.app.goo.gl
		// чаще отдает финальную https://www.google.com/maps/... ссылку
		const response = await fetch(url, {
			method: 'GET',
			redirect: 'follow',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Mobile Safari/537.36',
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		})

		let finalUrl = response.url || ''
		let html = ''
		try {
			html = await response.text()
		} catch (_) {}

		// Попытка вытащить редирект из meta refresh или скриптов
		if (!finalUrl || /intent:|comgooglemaps:\/\//i.test(finalUrl)) {
			const metaMatch = html.match(/url=([^"'>\s]+)/i)
			if (metaMatch && metaMatch[1]) {
				finalUrl = decodeURIComponent(metaMatch[1])
			}
		}

		// В попутных редиректах может быть обёртка https://www.google.com/url?…&q=<real>
		try {
			const u = new URL(finalUrl)
			const q =
				u.searchParams.get('q') ||
				u.searchParams.get('url') ||
				u.searchParams.get('link')
			if (q && /^https?:/i.test(q)) {
				finalUrl = q
			}
		} catch (_) {}

		res.status(200).json({ finalUrl })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}
