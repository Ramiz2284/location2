import { useState } from 'react'
import { extractCoordsFromLink } from '../utils/extractCoords'

export default function LocationForm({ onAdd }) {
	const [input, setInput] = useState('')
	const [highlight, setHighlight] = useState(false) // ✅ для эффекта

	async function handleAdd() {
		const coords = await extractCoordsFromLink(input)
		if (!coords) {
			alert('Не удалось получить координаты. Убедись, что ссылка Google Maps.')
			return
		}
		onAdd(coords)
		setInput('')
	}

	async function handlePasteFromClipboard() {
		try {
			const text = await navigator.clipboard.readText()
			if (text && text.length > 5 && text !== input) {
				setInput(text)

				// ✅ запускаем подсветку
				setHighlight(true)
				setTimeout(() => setHighlight(false), 800)
			}
		} catch (e) {}
	}

	return (
		<div style={{ marginBottom: '10px' }}>
			<input
				style={{
					width: '300px',
					padding: '5px',
					border: highlight ? '2px solid #00c853' : '1px solid #ccc', // ✅ зелёная рамка
					transition: '0.3s',
				}}
				value={input}
				onFocus={handlePasteFromClipboard}
				onClick={handlePasteFromClipboard}
				onChange={e => setInput(e.target.value)}
				placeholder='Вставь ссылку Google Maps'
			/>
			<button onClick={handleAdd}>Добавить</button>
		</div>
	)
}
