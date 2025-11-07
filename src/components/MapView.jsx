import {
	GoogleMap,
	Marker,
	OverlayView,
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
					{/* ✅ Круглый маркер */}
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

					{/* ✅ Имя под маркером (без рамки) */}
					<OverlayView
						position={{ lat: p.lat, lng: p.lng }}
						mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
					>
						<div
							style={{
								position: 'relative',
								top: '25px',
								textAlign: 'center',
								color: '#000000',
								fontWeight: 'bold',
								fontSize: '13px',
								whiteSpace: 'nowrap',
								transform: 'translateX(-50%)',
								left: '50%',
								textShadow:
									'1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white',
							}}
						>
							{p.name}
						</div>
					</OverlayView>
				</div>
			))}

			{route.length > 1 && (
				<Polyline
					path={route.map(p => ({ lat: p.lat, lng: p.lng }))}
					options={{
						strokeColor: '#ff0800ff',
						strokeOpacity: 0.9,
						strokeWeight: 5,
					}}
				/>
			)}
		</GoogleMap>
	)
}
