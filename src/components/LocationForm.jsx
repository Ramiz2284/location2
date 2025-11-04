import { useState } from 'react'
import { extractCoordsFromLink } from '../utils/extractCoords'

export default function LocationForm({ onAdd }) {
	const [input, setInput] = useState('')
	const [name, setName] = useState('')
	const [highlight, setHighlight] = useState(false)

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

	return (
		<div style={{ marginBottom: '15px' }}>
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
