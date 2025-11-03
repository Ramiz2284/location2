import { useState } from 'react'
import { extractCoordsFromLink } from '../utils/extractCoords'
import { getCoordsByAddress } from '../utils/googleMapsApi'

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

export async function extractCoordsFromLink(link) {
	// ...старый парсер...
	const coords = extractCoordsFromRegularLink(link)
	if (coords) return coords

	// Если не нашли координаты — пробуем как адрес
	return await getCoordsByAddress(link)
}
