export default async function handler(req, res) {
	const { url } = req.query
	if (!url) {
		res.status(400).json({ error: 'No url provided' })
		return
	}

	try {
		// Делаем HEAD-запрос, чтобы получить финальный редирект
		const response = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow',
		})

		// Финальный URL после всех редиректов
		const finalUrl = response.url
		res.status(200).json({ finalUrl })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}
