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
			alert('Не удалось получить координаты. Убедись, что ссылка Google Maps.')
			return
		}

		if (!name.trim()) {
			alert('Добавь название локации — например "Ахмет Лара"')
			return
		}

		// ✅ отправляем в App не только координаты, но и имя
		onAdd({
			...coords,
			name,
		})

		// очистка полей
		setInput('')
		setName('')
	}

	async function handlePasteFromClipboard() {
		try {
			const text = await navigator.clipboard.readText()
			if (text && text.length > 5 && text !== input) {
				setInput(text)

				// ✅ эффект подсветки
				setHighlight(true)
				setTimeout(() => setHighlight(false), 800)
			}
		} catch (e) {}
	}

	async function handleUnshortenLink() {
		if (!shortLink.trim()) {
			alert('Вставь короткую ссылку Google Maps!')
			return
		}

		setLoading(true)

		try {
			// Используем API unshorten.me с ключом
			const apiKey = import.meta.env.VITE_UNSHORTEN_API_KEY
			const apiUrl = `https://unshorten.me/json/${encodeURIComponent(
				shortLink
			)}`

			const headers = {}
			if (apiKey) {
				headers['Authorization'] = `Token ${apiKey}`
			}

			const response = await fetch(apiUrl, { headers })
			const data = await response.json()

			if (data.success && data.resolved_url) {
				// Автоматически вставляем длинную ссылку в основной инпут
				setInput(data.resolved_url)
				setHighlight(true)
				setTimeout(() => setHighlight(false), 1500)
				alert('✅ Длинная ссылка получена и вставлена в поле ниже!')
			} else if (data.error) {
				alert(`Ошибка: ${data.error}`)
			} else {
				alert('Не удалось раскрыть ссылку. Попробуй вручную через unshorten.me')
				// Открываем сайт как fallback
				window.open(
					`https://unshorten.me/?url=${encodeURIComponent(shortLink)}`,
					'_blank'
				)
			}
		} catch (e) {
			console.error('Ошибка API unshorten.me:', e)
			alert('Ошибка подключения к API. Открываю сайт вручную...')
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
			{/* поле для короткой ссылки */}
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

			{/* поле для ссылки */}
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

			{/* поле для названия локации */}
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
