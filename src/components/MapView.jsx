import {
	GoogleMap,
	InfoWindow,
	Marker,
	Polyline,
	useJsApiLoader,
} from '@react-google-maps/api'
import { useState } from 'react'

const containerStyle = {
	width: '100%',
	height: '400px',
}

export default function MapView({ points, route }) {
	const [selectedPoint, setSelectedPoint] = useState(null)

	const defaultPosition = points[0] || { lat: 36.8841, lng: 30.7056 }

	const { isLoaded } = useJsApiLoader({
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
	})

	if (!isLoaded) return <div>Загрузка карты...</div>

	return (
		<GoogleMap
			mapContainerStyle={containerStyle}
			center={defaultPosition}
			zoom={12}
		>
			{/* ✅ Маркеры с номерами + кликабельность */}
			{points.map((p, i) => (
				<Marker
					key={i}
					position={{ lat: p.lat, lng: p.lng }}
					label={{
						text: String(i + 1),
						color: 'white',
						fontSize: '14px',
						fontWeight: 'bold',
					}}
					icon={{
						path: window.google.maps.SymbolPath.CIRCLE,
						scale: 18,
						fillColor: '#007aff',
						fillOpacity: 1,
						strokeWeight: 2,
						strokeColor: '#ffffff',
					}}
					onClick={() => setSelectedPoint({ ...p, index: i })}
				/>
			))}

			{/* ✅ Имя клиента возле маркера при клике */}
			{selectedPoint && (
				<InfoWindow
					position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
					onCloseClick={() => setSelectedPoint(null)}
				>
					<div style={{ fontSize: '14px' }}>
						<b>
							{selectedPoint.index + 1}. {selectedPoint.name}
						</b>
						<br />
						{selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
					</div>
				</InfoWindow>
			)}

			{/* ✅ Линия маршрута */}
			{route.length > 1 && (
				<Polyline
					path={route.map(p => ({ lat: p.lat, lng: p.lng }))}
					options={{
						strokeColor: '#007aff',
						strokeOpacity: 0.9,
						strokeWeight: 5,
					}}
				/>
			)}
		</GoogleMap>
	)
}
