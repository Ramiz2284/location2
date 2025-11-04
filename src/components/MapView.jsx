import {
	GoogleMap,
	Marker,
	Polyline,
	useJsApiLoader,
} from '@react-google-maps/api'
import { useRef } from 'react'

const containerStyle = {
	width: '100%',
	height: '400px',
}

export default function MyMap({ points, route }) {
	const defaultPosition = points[0] || { lat: 36.8841, lng: 30.7056 }

	const { isLoaded } = useJsApiLoader({
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
	})

	const mapRef = useRef(null)

	if (!isLoaded) return <div>Загрузка карты...</div>

	return (
		<GoogleMap
			mapContainerStyle={containerStyle}
			center={defaultPosition}
			zoom={12}
			onLoad={map => (mapRef.current = map)}
		>
			{/* ✅ Маркеры с именами и буквами */}
			{points.map((p, i) => (
				<Marker
					key={i}
					position={{ lat: p.lat, lng: p.lng }}
					label={{
						text: String(i + 1), // ✅ номер на карте
						color: 'white',
						fontSize: '14px',
					}}
					title={p.name} // ✅ при наведении показывает имя
				/>
			))}

			{/* ✅ Полилиния маршрута */}
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
