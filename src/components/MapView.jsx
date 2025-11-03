import {
	GoogleMap,
	Marker,
	Polyline,
	useJsApiLoader,
} from '@react-google-maps/api'
import React, { useRef } from 'react'

const containerStyle = {
	width: '100%',
	height: '400px',
}

export default function MyMap({ points, route, address }) {
	const defaultPosition = points[0] || { lat: 36.8841, lng: 30.7056 }
	const { isLoaded } = useJsApiLoader({
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
	})
	const mapRef = useRef(null)
	const markerRef = useRef(null)

	async function geocodeAndSetMarker(address) {
		if (!window.google || !address) return
		const geocoder = new window.google.maps.Geocoder()
		geocoder.geocode({ address }, (results, status) => {
			if (status === 'OK' && results[0]) {
				const location = results[0].geometry.location
				if (mapRef.current) {
					mapRef.current.panTo(location)
					mapRef.current.setZoom(15)
				}
				if (markerRef.current) {
					markerRef.current.setMap(null)
				}
				markerRef.current = new window.google.maps.Marker({
					map: mapRef.current,
					position: location,
				})
			} else {
				alert('Геокодирование не удалось: ' + status)
			}
		})
	}

	React.useEffect(() => {
		if (isLoaded && address) {
			geocodeAndSetMarker(address)
		}
	}, [isLoaded, address])

	if (!isLoaded) return <div>Загрузка карты...</div>

	return (
		<GoogleMap
			mapContainerStyle={containerStyle}
			center={defaultPosition}
			zoom={12}
			onLoad={map => (mapRef.current = map)}
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
