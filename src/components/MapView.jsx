import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'

export default function MapView({ points, route }) {
	const defaultPosition = points[0] || { lat: 36.8841, lng: 30.7056 }

	return (
		<MapContainer
			center={[defaultPosition.lat, defaultPosition.lng]}
			zoom={12}
			style={{ height: '400px', width: '100%', marginTop: '20px' }}
		>
			<TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

			{points.map((p, i) => (
				<Marker key={i} position={[p.lat, p.lng]} />
			))}

			{route.length > 1 && (
				<Polyline positions={route.map(p => [p.lat, p.lng])} />
			)}
		</MapContainer>
	)
}
