// Serverless endpoint: tries to extract coordinates directly from a full Google Maps link
// WITHOUT converting textual q= into geocoding. We only trust what the link / HTML reveals.
// Strategy:
// 1. Fetch the URL with redirects. If final URL contains !3dLAT!4dLNG or @LAT,LNG pattern — return.
// 2. If not, request an embed version (append &output=embed) and scan HTML for !3d / !4d or "center":{"lat":, "lng":}
// 3. Return {lat,lng} or null.

export default async function handler(req, res) {
	const { url } = req.query
	if (!url) {
		res.status(400).json({ error: 'No url provided' })
		return
	}
	try {
		console.log('[resolve] incoming', url)
		const final = await fetchFollow(url)
		console.log('[resolve] final redirect URL', final)
		const directCoords = extractFromString(final)
		if (directCoords) {
			console.log('[resolve] direct coords from final URL', directCoords)
			res.status(200).json({ source: 'redirect', coords: directCoords })
			return
		}
		// Try resolving via CID if present (link-only, no text). Some q/ftid links include a CID in hex.
		const cid = extractCid(url) || extractCid(final)
		if (cid) console.log('[resolve] cid detected', cid)
		if (cid) {
			const cidUrl = `https://maps.google.com/?cid=${cid}`
			console.log('[resolve] cid url', cidUrl)
			const cidFinal = await fetchFollow(cidUrl)
			console.log('[resolve] cid final', cidFinal)
			const cidCoords = extractFromString(cidFinal)
			if (cidCoords) {
				console.log('[resolve] cid direct coords', cidCoords)
				res.status(200).json({ source: 'cid', coords: cidCoords })
				return
			}
			const cidEmbed = appendParam(cidFinal, 'output', 'embed')
			console.log('[resolve] cid embed url', cidEmbed)
			const cidHtml = await fetchText(cidEmbed)
			const cidHtmlCoords = extractFromString(cidHtml)
			if (cidHtmlCoords) {
				console.log('[resolve] cid embed coords', cidHtmlCoords)
				res.status(200).json({ source: 'cid-embed', coords: cidHtmlCoords })
				return
			}
		}
		// Try embed
		const embedUrl = appendParam(final, 'output', 'embed')
		console.log('[resolve] embed url', embedUrl)
		const html = await fetchText(embedUrl)
		const htmlCoords = extractFromString(html)
		if (htmlCoords) {
			console.log('[resolve] embed coords', htmlCoords)
			res.status(200).json({ source: 'embed', coords: htmlCoords })
			return
		}
		res.status(200).json({ source: 'none', coords: null })
	} catch (e) {
		console.log('[resolve] exception', e)
		res.status(500).json({ error: e.message })
	}
}

async function fetchFollow(u) {
	const resp = await fetch(u, {
		method: 'GET',
		redirect: 'follow',
		headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
	})
	return resp.url || u
}

async function fetchText(u) {
	const resp = await fetch(u, {
		method: 'GET',
		redirect: 'follow',
		headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
	})
	return await resp.text()
}

function appendParam(u, key, val) {
	try {
		const urlObj = new URL(u)
		if (!urlObj.searchParams.has(key)) urlObj.searchParams.append(key, val)
		return urlObj.toString()
	} catch {
		return u
	}
}

function extractFromString(str) {
	if (!str) return null
	// !3dLAT!4dLNG pattern
	const m1 = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
	if (m1) return { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) }
	// @LAT,LNG pattern (avoid grabbing zoom)
	const m2 = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:[,/])/)
	if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) }
	// JSON center snippet
	const m3 = str.match(
		/center"?:\s*\{\s*"?lat"?\s*:\s*(-?\d+\.\d+)\s*,\s*"?lng"?\s*:\s*(-?\d+\.\d+)/
	)
	if (m3) return { lat: parseFloat(m3[1]), lng: parseFloat(m3[2]) }
	return null
}
// Extract CID (decimal) from URL parameters. Supports:
// - direct cid=1234567890
// - ftid=0x...:0xHEX (take second hex as CID, convert to decimal)
function extractCid(u) {
	try {
		const urlObj = new URL(u)
		const direct = urlObj.searchParams.get('cid')
		if (direct) return direct
		const ftid = urlObj.searchParams.get('ftid')
		if (ftid) {
			const m = ftid.match(/:0x([0-9a-fA-F]+)/)
			if (m) {
				try {
					const dec = BigInt('0x' + m[1]).toString(10)
					return dec
				} catch (_) {}
			}
		}
	} catch (_) {}
	return null
}
