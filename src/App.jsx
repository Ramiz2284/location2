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

	// ✅ Сохраняем точки
	useEffect(() => {
		localStorage.setItem('points', JSON.stringify(points))
	}, [points])

	// ✅ Добавить точку (lat, lng, name)
	function addPoint(point) {
		setPoints(prev => [...prev, point])
	}

	function clearPoints() {
		setPoints([])
		setRoute([])
	}

	// ✅ Получить текущую геопозицию
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

	// ✅ Построение маршрута через Google Maps
	async function buildRoute() {
		if (points.length < 2) {
			alert('Нужно минимум 2 точки')
			return
		}

		if (!window.google) {
			alert('Google Maps не загрузился')
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

		const directionsService = new window.google.maps.DirectionsService()

		// ✅ Преобразуем точки в формат Google
		const waypoints = points.map(p => ({
			location: { lat: p.lat, lng: p.lng },
			stopover: true,
		}))

		const origin = { lat: startCoords.lat, lng: startCoords.lng }
		const destination = waypoints[waypoints.length - 1].location

		directionsService.route(
			{
				origin,
				destination,
				waypoints,
				travelMode: window.google.maps.TravelMode.DRIVING,
				optimizeWaypoints: true, // ✅ Google сам оптимизирует порядок
			},
			(result, status) => {
				if (status === 'OK') {
					const path = result.routes[0].overview_path.map(p => ({
						lat: p.lat(),
						lng: p.lng(),
					}))
					setRoute(path)
				} else {
					alert('Ошибка построения маршрута: ' + status)
				}
			}
		)
	}

	return (
		<div style={{ padding: '20px' }}>
			<h2>Маршрут доставки</h2>

			{/* Добавление точки */}
			<LocationForm onAdd={addPoint} />

			{/* GPS */}
			<button onClick={getMyPosition}>Моё местоположение</button>
			{gps && (
				<p>
					Моя позиция: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
				</p>
			)}

			{/* Список точек */}
			<h3>Точки:</h3>
			<ul>
				{points.map((p, i) => (
					<li key={i}>
						<b>{p.name}</b> — {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
					</li>
				))}
			</ul>

			{points.length > 0 && <button onClick={clearPoints}>Очистить</button>}

			{/* Выбор старта */}
			<h3>Стартовая точка:</h3>
			<select value={start} onChange={e => setStart(e.target.value)}>
				<option value='gps'>Моё местоположение</option>
				{points.map((p, i) => (
					<option value={i} key={i}>
						{p.name}
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
