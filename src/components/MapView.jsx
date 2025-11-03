import {
	GoogleMap,
	Marker,
	Polyline,
	useJsApiLoader,
} from '@react-google-maps/api'

const containerStyle = {
	width: '100%',
	height: '400px',
}

export default function MyMap({ points, route }) {
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
				<Marker key={i} position={{ lat: p.lat, lng: p.lng }} />
			))}

			{route.length > 1 && (
				<Polyline path={route.map(p => ({ lat: p.lat, lng: p.lng }))} />
			)}
		</GoogleMap>
	)
}
