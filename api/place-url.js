// Returns canonical Google Maps place URL via Places Details API.
// Input: place_id or coords (lat,lng). If only coords provided, we first reverse geocode to get a place_id.
// Output: { url, placeId } or { error }

export default async function handler(req, res) {
	const { place_id, lat, lng } = req.query
	const apiKey =
		process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
	if (!apiKey) {
		res
			.status(500)
			.json({ error: 'Missing API key (VITE_GOOGLE_MAPS_API_KEY)' })
		return
	}

	try {
		let finalPlaceId = place_id

		// If no place_id but coords present — reverse geocode to get place_id
		if (!finalPlaceId && lat && lng) {
			const revUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
			const revResp = await fetch(revUrl)
			const revData = await revResp.json()
			if (
				revData.status === 'OK' &&
				revData.results &&
				revData.results.length
			) {
				// Take first result with place_id
				finalPlaceId = revData.results[0].place_id
			}
		}

		if (!finalPlaceId) {
			res.status(400).json({ error: 'Need place_id or lat,lng' })
			return
		}

		// Places Details request with fields=url
		const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${finalPlaceId}&fields=url&key=${apiKey}`
		const detResp = await fetch(detailsUrl)
		const detData = await detResp.json()
		if (detData.status !== 'OK') {
			res
				.status(500)
				.json({ error: 'Places Details failed', status: detData.status })
			return
		}
		const canonicalUrl = detData.result && detData.result.url
		if (!canonicalUrl) {
			res.status(404).json({ error: 'No canonical url in result' })
			return
		}
		res.status(200).json({ url: canonicalUrl, placeId: finalPlaceId })
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}
