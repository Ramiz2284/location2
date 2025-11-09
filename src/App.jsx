import { useEffect, useState } from 'react'
import LocationForm from './components/LocationForm'
import MapView from './components/MapView'

const styles = {
	container: {
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100vh',
		background: '#1a1a1a',
		padding: '16px',
		gap: '16px',
	},
	header: {
		textAlign: 'center',
		marginBottom: '8px',
	},
	title: {
		fontSize: '28px',
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: '4px',
	},
	subtitle: {
		fontSize: '14px',
		color: '#a0a0a0',
		fontWeight: '400',
	},
	card: {
		background: '#1a1a1a',
		borderRadius: '8px',
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
		padding: '16px',
	},
	sectionTitle: {
		fontSize: '16px',
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: '12px',
	},
	pointsList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0',
	},
	pointItem: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '12px 0',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
	},
	pointItemLast: {
		borderBottom: 'none',
	},
	pointInfo: {
		flex: 1,
	},
	pointName: {
		fontSize: '14px',
		fontWeight: '500',
		color: '#ffffff',
		marginBottom: '2px',
	},
	pointCoords: {
		fontSize: '12px',
		color: '#a0a0a0',
	},
	deleteButton: {
		background: 'none',
		border: 'none',
		color: '#a0a0a0',
		cursor: 'pointer',
		fontSize: '20px',
		padding: '4px 8px',
		transition: 'color 0.2s ease',
	},
	buttonGroup: {
		display: 'flex',
		gap: '8px',
		marginTop: '12px',
	},
	button: {
		flex: 1,
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
	mapContainer: {
		flex: 1,
		minHeight: '400px',
		borderRadius: '8px',
		overflow: 'hidden',
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
	},
	selectContainer: {
		marginTop: '12px',
	},
	label: {
		display: 'block',
		fontSize: '14px',
		color: '#a0a0a0',
		marginBottom: '8px',
	},
	select: {
		width: '100%',
		padding: '10px 12px',
		fontSize: '16px',
		borderRadius: '8px',
		border: 'none',
		background: '#1a1a1a',
		color: '#ffffff',
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
		cursor: 'pointer',
	},
	gpsInfo: {
		fontSize: '12px',
		color: '#a0a0a0',
		marginTop: '8px',
	},
}

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

	function deletePoint(index) {
		setPoints(prev => prev.filter((_, i) => i !== index))
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
		const origin = { lat: startCoords.lat, lng: startCoords.lng }
		const destination = {
			lat: points[points.length - 1].lat,
			lng: points[points.length - 1].lng,
		}

		// ✅ Промежуточные точки (все кроме последней)
		const waypoints = points.slice(0, -1).map(p => ({
			location: { lat: p.lat, lng: p.lng },
			stopover: true,
		}))

		console.log('🚗 Строим маршрут:', {
			origin,
			destination,
			waypoints,
			pointsCount: points.length,
		})

		directionsService.route(
			{
				origin,
				destination,
				waypoints,
				travelMode: window.google.maps.TravelMode.DRIVING,
				optimizeWaypoints: true, // ✅ Google сам оптимизирует порядок
			},
			(result, status) => {
				console.log('📍 Результат Directions API:', status, result)

				if (status === 'OK') {
					const path = result.routes[0].overview_path.map(p => ({
						lat: p.lat(),
						lng: p.lng(),
					}))
					setRoute(path)
					console.log('✅ Маршрут построен, точек:', path.length)
				} else {
					console.error('❌ Ошибка Directions API:', status, result)
					alert('Ошибка построения маршрута: ' + status)
				}
			}
		)
	}

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<h1 style={styles.title}>Планировщик маршрутов</h1>
				<p style={styles.subtitle}>
					Добавляйте точки и стройте оптимальный маршрут
				</p>
			</div>

			<div style={styles.card}>
				<LocationForm onAdd={addPoint} />

				<button
					style={{ ...styles.button, marginTop: '12px' }}
					onClick={getMyPosition}
					onMouseEnter={e => (e.target.style.background = '#2563EB')}
					onMouseLeave={e => (e.target.style.background = '#3B82F6')}
				>
					Моё местоположение
				</button>

				{gps && (
					<p style={styles.gpsInfo}>
						GPS: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
					</p>
				)}
			</div>

			{points.length > 0 && (
				<div style={styles.card}>
					<h2 style={styles.sectionTitle}>Точки маршрута ({points.length})</h2>
					<div style={styles.pointsList}>
						{points.map((point, index) => (
							<div
								key={index}
								style={{
									...styles.pointItem,
									...(index === points.length - 1 ? styles.pointItemLast : {}),
								}}
							>
								<div style={styles.pointInfo}>
									<div style={styles.pointName}>
										{index + 1}. {point.name}
									</div>
									<div style={styles.pointCoords}>
										{point.lat.toFixed(6)}, {point.lng.toFixed(6)}
									</div>
								</div>
								<button
									style={styles.deleteButton}
									onClick={() => deletePoint(index)}
									onMouseEnter={e => (e.target.style.color = '#ef4444')}
									onMouseLeave={e => (e.target.style.color = '#a0a0a0')}
								>
									×
								</button>
							</div>
						))}
					</div>

					<div style={styles.selectContainer}>
						<label style={styles.label}>Стартовая точка</label>
						<select
							style={styles.select}
							value={start}
							onChange={e => setStart(e.target.value)}
						>
							<option value='gps'>Моё местоположение (GPS)</option>
							{points.map((p, i) => (
								<option value={i} key={i}>
									{i + 1}. {p.name}
								</option>
							))}
						</select>
					</div>

					<div style={styles.buttonGroup}>
						<button
							style={styles.button}
							onClick={buildRoute}
							onMouseEnter={e => (e.target.style.background = '#2563EB')}
							onMouseLeave={e => (e.target.style.background = '#3B82F6')}
						>
							Построить маршрут
						</button>
						<button
							style={{ ...styles.button, ...styles.buttonSecondary }}
							onClick={clearPoints}
							onMouseEnter={e =>
								(e.target.style.background = 'rgba(59, 130, 246, 0.25)')
							}
							onMouseLeave={e =>
								(e.target.style.background = 'rgba(59, 130, 246, 0.15)')
							}
						>
							Очистить всё
						</button>
					</div>
				</div>
			)}

			<div style={styles.mapContainer}>
				<MapView points={points} route={route} />
			</div>
		</div>
	)
}
