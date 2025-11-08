import { useState } from 'react'
import { extractCoordsFromLink } from '../utils/extractCoords'

export default function LocationForm({ onAdd }) {
	const [input, setInput] = useState('')
	const [name, setName] = useState('')
	const [highlight, setHighlight] = useState(false)
	const [shortLink, setShortLink] = useState('')
	const [loading, setLoading] = useState(false)

	async function handleAdd() {
		const coords = await extractCoordsFromLink(input)
		if (!coords) {
			const preview =
				input.length > 100 ? input.substring(0, 100) + '...' : input
			alert(`Не удалось получить координаты из:\n${preview}`)
			return
		}
		if (!name.trim()) {
			alert('Добавь название локации')
			return
		}
		onAdd({ ...coords, name })
		setInput('')
		setName('')
	}

	async function handlePasteFromClipboard() {
		try {
			const text = await navigator.clipboard.readText()
			if (text && text.length > 5 && text !== input) {
				setInput(text)
				setHighlight(true)
				setTimeout(() => setHighlight(false), 800)
			}
		} catch {}
	}

	async function handleUnshortenLink() {
		if (!shortLink.trim()) {
			alert('Вставь короткую ссылку Google Maps')
			return
		}
		setLoading(true)
		try {
			const apiKey = import.meta.env.VITE_UNSHORTEN_API_KEY
			const apiUrl = `https://unshorten.me/json/${encodeURIComponent(
				shortLink
			)}`
			const headers = {}
			if (apiKey) headers['Authorization'] = `Token ${apiKey}`
			const response = await fetch(apiUrl, { headers })
			const data = await response.json()
			if (data.success && data.resolved_url) {
				let finalUrl = data.resolved_url
				if (finalUrl.includes('consent.google.com')) {
					try {
						const url = new URL(finalUrl)
						const cont = url.searchParams.get('continue')
						if (cont) finalUrl = decodeURIComponent(cont)
					} catch {}
				}
				setInput(finalUrl)
				setHighlight(true)
				setTimeout(() => setHighlight(false), 1500)
				try {
					const coords = await extractCoordsFromLink(finalUrl)
					if (coords) {
						const deriveName = urlStr => {
							try {
								const u = new URL(urlStr)
								const parts = u.pathname.split('/')
								const idx = parts.findIndex(p => p === 'place')
								if (idx >= 0 && parts[idx + 1]) {
									return decodeURIComponent(parts[idx + 1]).replace(/\+/g, ' ')
								}
								const q = u.searchParams.get('q')
								if (q && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(q))
									return decodeURIComponent(q.replace(/\+/g, ' '))
							} catch {}
							return 'Метка'
						}
						const finalName = (name && name.trim()) || deriveName(finalUrl)
						onAdd({ ...coords, name: finalName })
						setInput('')
						setName('')
						alert('✅ Метка добавлена')
					} else {
						alert('✅ Длинная ссылка вставлена — нажми "Добавить"')
					}
				} catch (e) {
					alert('✅ Длинная ссылка получена — можно нажать "Добавить"')
				}
			} else if (data.error) {
				alert(`Ошибка: ${data.error}`)
			} else {
				alert('Не удалось раскрыть ссылку')
				window.open(
					`https://unshorten.me/?url=${encodeURIComponent(shortLink)}`,
					'_blank'
				)
			}
		} catch (e) {
			alert('Ошибка API unshorten.me')
			window.open(
				`https://unshorten.me/?url=${encodeURIComponent(shortLink)}`,
				'_blank'
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={{ marginBottom: '15px' }}>
			<input
				style={{
					width: '300px',
					padding: '5px',
					border: '1px solid #ff9800',
					display: 'block',
					marginBottom: '8px',
				}}
				value={shortLink}
				onChange={e => setShortLink(e.target.value)}
				placeholder='Вставь короткую ссылку (maps.app.goo.gl)'
			/>
			<button
				style={{ marginBottom: '12px' }}
				onClick={handleUnshortenLink}
				disabled={loading}
			>
				{loading ? 'Получаю длинную ссылку...' : 'Получить длинную ссылку'}
			</button>
			<input
				style={{
					width: '300px',
					padding: '5px',
					border: highlight ? '2px solid #00c853' : '1px solid #ccc',
					transition: '0.3s',
					display: 'block',
					marginBottom: '8px',
				}}
				value={input}
				onFocus={handlePasteFromClipboard}
				onClick={handlePasteFromClipboard}
				onChange={e => setInput(e.target.value)}
				placeholder='Вставь ссылку Google Maps'
			/>
			<input
				style={{
					width: '300px',
					padding: '5px',
					border: '1px solid #ccc',
					display: 'block',
					marginBottom: '8px',
				}}
				value={name}
				onChange={e => setName(e.target.value)}
				placeholder='Имя / район / заказчик'
			/>
			<button onClick={handleAdd}>Добавить</button>
		</div>
	)
}
