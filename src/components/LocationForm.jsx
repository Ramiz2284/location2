import { useState } from 'react'
import { extractCoordsFromLink } from '../utils/extractCoords'
import { encodeCoords } from '../utils/shortlink'

const styles = {
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	inputGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
	},
	input: {
		width: '100%',
		padding: '10px 12px',
		fontSize: '16px',
		borderRadius: '8px',
		border: 'none',
		background: '#1a1a1a',
		color: '#ffffff',
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
		transition: 'all 0.2s ease',
	},
	inputHighlight: {
		outline: '2px solid #00c853',
		boxShadow: '0 2px 12px rgba(0, 200, 83, 0.3)',
	},
	button: {
		padding: '10px',
		fontSize: '16px',
		fontWeight: '500',
		borderRadius: '8px',
		border: 'none',
		cursor: 'pointer',
		transition: 'all 0.2s ease',
		background: '#3B82F6',
		color: '#ffffff',
	},
	buttonSecondary: {
		background: 'rgba(59, 130, 246, 0.15)',
		color: '#3B82F6',
	},
}

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
		try {
			const token = encodeCoords(coords)
			if (token) {
				const shortUrl = `${window.location.origin}/api/short?t=${token}`
				await navigator.clipboard?.writeText?.(shortUrl)
				alert(`Короткая ссылка скопирована:\n${shortUrl}`)
			}
		} catch {}
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
				// 1) Разворачиваем обёртки вида https://www.google.com/url?...&q=<real>
				try {
					const u = new URL(finalUrl)
					const wrapped =
						u.searchParams.get('q') ||
						u.searchParams.get('url') ||
						u.searchParams.get('link')
					if (wrapped && /^https?:/i.test(wrapped)) {
						finalUrl = decodeURIComponent(wrapped)
					}
				} catch {}
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
						try {
							const token = encodeCoords(coords)
							if (token) {
								const shortUrl = `${window.location.origin}/api/short?t=${token}`
								await navigator.clipboard?.writeText?.(shortUrl)
								alert(
									`✅ Метка добавлена\nКороткая ссылка скопирована:\n${shortUrl}`
								)
								setInput('')
								setName('')
								return
							}
						} catch {}
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
		<div style={styles.container}>
			<div style={styles.inputGroup}>
				<input
					style={styles.input}
					value={shortLink}
					onChange={e => setShortLink(e.target.value)}
					placeholder='Короткая ссылка (maps.app.goo.gl)'
				/>
				<button
					style={{ ...styles.button, ...styles.buttonSecondary }}
					onClick={handleUnshortenLink}
					disabled={loading}
					onMouseEnter={e =>
						!loading && (e.target.style.background = 'rgba(59, 130, 246, 0.25)')
					}
					onMouseLeave={e =>
						!loading && (e.target.style.background = 'rgba(59, 130, 246, 0.15)')
					}
				>
					{loading ? 'Получаю длинную ссылку...' : 'Получить длинную ссылку'}
				</button>
			</div>

			<div style={styles.inputGroup}>
				<input
					style={{
						...styles.input,
						...(highlight ? styles.inputHighlight : {}),
					}}
					value={input}
					onFocus={handlePasteFromClipboard}
					onClick={handlePasteFromClipboard}
					onChange={e => setInput(e.target.value)}
					placeholder='Ссылка Google Maps'
				/>
				<input
					style={styles.input}
					value={name}
					onChange={e => setName(e.target.value)}
					placeholder='Название точки'
				/>
				<button
					style={styles.button}
					onClick={handleAdd}
					onMouseEnter={e => (e.target.style.background = '#2563EB')}
					onMouseLeave={e => (e.target.style.background = '#3B82F6')}
				>
					Добавить
				</button>
			</div>
		</div>
	)
}
