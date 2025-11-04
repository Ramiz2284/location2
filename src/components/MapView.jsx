import {
	GoogleMap,
	InfoWindow,
	Marker,
	Polyline,
	useJsApiLoader,
} from '@react-google-maps/api'

const containerStyle = {
	width: '100%',
	height: '400px',
}

export default function MapView({ points, route }) {
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
			{points.map((p, i) => (
				<div key={i}>
					{/* ✅ КРУГЛЫЙ МАРКЕР С НОМЕРОМ */}
					<Marker
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
					/>

					{/* ✅ ИМЯ ПОД МАРКЕРОМ, ВСЕГДА ПОКАЗЫВАЕТСЯ */}
					<InfoWindow
						position={{ lat: p.lat, lng: p.lng }}
						options={{ pixelOffset: new window.google.maps.Size(0, 25) }} // смещение вниз
					>
						<div
							style={{ fontSize: '14px', fontWeight: 'bold', color: '#007aff' }}
						>
							{i + 1}. {p.name}
						</div>
					</InfoWindow>
				</div>
			))}

			{/* ✅ Маршрут */}
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
