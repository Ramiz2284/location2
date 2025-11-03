import { useState } from 'react'
import { extractCoordsFromLink } from '../utils/extractCoords'

export default function LocationForm({ onAdd }) {
	const [input, setInput] = useState('')

	async function handleAdd() {
		const coords = await extractCoordsFromLink(input)
		if (!coords) {
			alert('Не удалось получить координаты. Убедись, что ссылка Google Maps.')
			return
		}
		onAdd(coords)
		setInput('')
	}

	return (
		<div style={{ marginBottom: '10px' }}>
			<input
				style={{ width: '300px' }}
				value={input}
				onChange={e => setInput(e.target.value)}
				placeholder='Вставь ссылку Google Maps'
			/>
			<button onClick={handleAdd}>Добавить</button>
		</div>
	)
}
