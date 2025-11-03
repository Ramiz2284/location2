import axios from 'axios'
import { useEffect, useState } from 'react'
import LocationForm from './components/LocationForm'
import MapView from './components/MapView'

export default function App() {
	const [points, setPoints] = useState(() => {
		const saved = localStorage.getItem('points')
		return saved ? JSON.parse(saved) : []
	})

	const [start, setStart] = useState('gps')
	const [gps, setGps] = useState(null)
	const [route, setRoute] = useState([])

	// Сохраняем точки
	useEffect(() => {
		localStorage.setItem('points', JSON.stringify(points))
	}, [points])

	function addPoint(coords) {
		setPoints([...points, coords])
	}

	function clearPoints() {
		setPoints([])
		setRoute([])
	}

	// Получение текущей локации
	function getMyPosition() {
		navigator.geolocation.getCurrentPosition(
			pos => {
				setGps({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
				})
			},
			() => alert('Не удалось получить GPS')
		)
	}

	// Оптимизация маршрута через OpenRouteService
	async function buildRoute() {
		if (points.length < 2) {
			alert('Нужно минимум 2 точки')
			return
		}

		let startCoords
		if (start === 'gps') {
			if (!gps) {
				alert("Нажми 'Моё местоположение'")
				return
			}
			startCoords = gps
		} else {
			startCoords = points[start]
		}

		const all = [startCoords, ...points]

		const body = {
			coordinates: all.map(p => [p.lng, p.lat]),
			format: 'geojson',
		}

		// Бесплатный OpenRouteService demo key (нужно заменить позже своим)
		const token = '5b3ce3597851110001cf6248xxxxxxxxxxxxxxxx'

		const res = await axios.post(
			'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
			body,
			{
				headers: { Authorization: token },
			}
		)

		const coords = res.data.features[0].geometry.coordinates.map(c => ({
			lat: c[1],
			lng: c[0],
		}))

		setRoute(coords)
	}

	return (
		<div style={{ padding: '20px' }}>
			<h2>Маршрут доставки</h2>

			<LocationForm onAdd={addPoint} />

			<button onClick={getMyPosition}>Моё местоположение</button>
			{gps && (
				<p>
					Моя позиция: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
				</p>
			)}

			<h3>Точки:</h3>
			<ul>
				{points.map((p, i) => (
					<li key={i}>
						{p.lat.toFixed(5)}, {p.lng.toFixed(5)}
					</li>
				))}
			</ul>

			{points.length > 0 && <button onClick={clearPoints}>Очистить</button>}

			<h3>Стартовая точка:</h3>
			<select value={start} onChange={e => setStart(e.target.value)}>
				<option value='gps'>Моё местоположение</option>
				{points.map((p, i) => (
					<option value={i} key={i}>
						{p.lat.toFixed(3)}, {p.lng.toFixed(3)}
					</option>
				))}
			</select>

			<br />
			<button onClick={buildRoute} style={{ marginTop: '10px' }}>
				Построить маршрут
			</button>

			<MapView points={points} route={route} />
		</div>
	)
}
