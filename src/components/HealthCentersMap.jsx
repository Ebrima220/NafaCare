import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useDarkMode } from '../hooks/useDarkMode'
import catalog from '../data/health-facilities.json'

// OpenStreetMap health facilities in The Gambia (snapshot 8 September 2026).
// A live Overpass search was missing buildings, timing out, and pinning the
// centre of the wrong outline. This list is deduped to one pin per place.

const GAMBIA_BOUNDS = { south: 13.065, west: -16.825, north: 13.825, east: -13.797 }
const GAMBIA_CENTER = [13.4432, -15.3101]
const BANJUL = { lat: 13.4549, lon: -16.579 }

const TYPE_LABEL = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  pharmacy: 'Pharmacy',
  health: 'Health centre',
  doctors: "Doctor's office",
  dentist: 'Dentist',
}

const TYPE_COLOR = {
  hospital: '#dc2626',
  clinic: '#059669',
  pharmacy: '#2563eb',
  health: '#7c3aed',
  doctors: '#059669',
  dentist: '#0f766e',
}

function makeIcon(color) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`)
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:36px;background:url('data:image/svg+xml,${svg}') center / contain no-repeat"></div>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -32],
  })
}

const ICONS = Object.fromEntries(Object.entries(TYPE_COLOR).map(([type, color]) => [type, makeIcon(color)]))

const YOU_ICON = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 7px rgba(37,99,235,.28)"></div>`,
})

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function insideGambia(lat, lon) {
  return lat >= GAMBIA_BOUNDS.south && lat <= GAMBIA_BOUNDS.north
    && lon >= GAMBIA_BOUNDS.west && lon <= GAMBIA_BOUNDS.east
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]))
}

function popupHtml(facility, isDark, showDistance) {
  const title = isDark ? '#10b981' : '#059669'
  const muted = isDark ? '#94a3b8' : '#64748b'
  const text = isDark ? '#e2e8f0' : '#475569'
  const place = [facility.place, facility.region].filter(Boolean).join(', ')
  return `
    <div style="min-width:180px;color:${text}">
      <b style="color:${title}">${escapeHtml(facility.name)}</b><br/>
      <span style="font-size:12px;color:${muted}">${escapeHtml(facility.label)}${place ? ` · ${escapeHtml(place)}` : ''}</span>
      ${showDistance ? `<br/><span style="font-size:12px;color:${text}">${facility.dist.toFixed(1)} km away</span>` : ''}
    </div>`
}

function directionsUrl(from, to, mode) {
  const params = new URLSearchParams({
    api: '1',
    destination: `${to.lat},${to.lon}`,
    travelmode: mode === 'foot' ? 'walking' : 'driving',
  })
  // Only pass an origin we actually measured. A Banjul fallback would start the route in the wrong place.
  if (from) params.set('origin', `${from.lat},${from.lon}`)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function facilitiesAround(lat, lon, radiusKm) {
  const ranked = catalog
    .map((facility) => ({
      ...facility,
      label: TYPE_LABEL[facility.type] || TYPE_LABEL.health,
      icon: ICONS[facility.type] || ICONS.health,
      dist: distanceKm(lat, lon, facility.lat, facility.lon),
    }))
    .sort((a, b) => a.dist - b.dist)

  if (radiusKm == null) return { list: ranked, widened: false }
  const within = ranked.filter((facility) => facility.dist <= radiusKm)
  if (within.length > 0) return { list: within, widened: false }
  return { list: ranked.slice(0, 12), widened: true }
}

export default function HealthCentersMap({ open, onClose }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const userMarkerRef = useRef(null)
  const accuracyRef = useRef(null)
  const facilityLayerRef = useRef(null)
  const routeLayerRef = useRef(null)
  const markerByIdRef = useRef(new Map())
  const watchRef = useRef(null)
  const routeTokenRef = useRef(0)
  const radiusRef = useRef(null)
  const radiusPickedRef = useRef(false)
  const userPosRef = useRef(null)
  const aliveRef = useRef(false)
  const darkRef = useRef(false)
  const measuredRef = useRef('country')

  const [isDark] = useDarkMode()
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [facilities, setFacilities] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationNote, setLocationNote] = useState('')
  const [measuredFrom, setMeasuredFrom] = useState('country')
  const [searchRadius, setSearchRadius] = useState(null)
  const [widened, setWidened] = useState(false)
  const [travelMode, setTravelMode] = useState('driving')
  const [route, setRoute] = useState(null)

  darkRef.current = isDark
  measuredRef.current = measuredFrom
  radiusRef.current = searchRadius
  const selected = facilities.find((facility) => facility.id === selectedId) || null

  function drawUser(map, pos) {
    if (accuracyRef.current) accuracyRef.current.remove()
    if (userMarkerRef.current) userMarkerRef.current.remove()
    accuracyRef.current = L.circle([pos.lat, pos.lon], {
      radius: Math.max(pos.accuracy || 40, 20),
      color: '#2563eb',
      weight: 1,
      fillColor: '#2563eb',
      fillOpacity: 0.12,
    }).addTo(map)
    userMarkerRef.current = L.marker([pos.lat, pos.lon], { icon: YOU_ICON, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<b>You are here</b>')
  }

  function drawFacilities(map, list) {
    const layer = facilityLayerRef.current
    if (!layer) return
    layer.clearLayers()
    markerByIdRef.current = new Map()
    list.forEach((facility) => {
      const marker = L.marker([facility.lat, facility.lon], { icon: facility.icon })
        .addTo(layer)
        .bindPopup(popupHtml(facility, darkRef.current, measuredRef.current !== 'country'))
      marker.facility = facility
      marker.on('click', () => focusFacility(facility))
      markerByIdRef.current.set(facility.id, marker)
    })
  }

  function showFacilities(map, lat, lon, radius) {
    const { list, widened: didWiden } = facilitiesAround(lat, lon, radius)
    setFacilities(list)
    setWidened(didWiden)
    drawFacilities(map, list)
    setStatus('ready')
    setErrorMsg('')
    return list
  }

  function clearRoute() {
    routeTokenRef.current += 1
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
      routeLayerRef.current = null
    }
    setRoute(null)
  }

  async function routeTo(facility, mode = travelMode) {
    const map = mapRef.current
    const from = userPosRef.current
    setSelectedId(facility.id)
    markerByIdRef.current.get(facility.id)?.openPopup()
    if (!map || !from) {
      clearRoute()
      setSelectedId(facility.id)
      map?.flyTo([facility.lat, facility.lon], 16, { duration: 0.8 })
      return
    }

    const token = ++routeTokenRef.current
    if (routeLayerRef.current) routeLayerRef.current.remove()
    const line = L.polyline([[from.lat, from.lon], [facility.lat, facility.lon]], {
      color: '#059669',
      weight: 5,
      opacity: 0.9,
      dashArray: '8 8',
    }).addTo(map)
    routeLayerRef.current = line
    setRoute({ facilityId: facility.id, loading: true, mode })

    try {
      const profile = mode === 'foot' ? 'foot' : 'driving'
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${from.lon},${from.lat};${facility.lon},${facility.lat}?overview=full&geometries=geojson`,
      )
      if (token !== routeTokenRef.current) return
      if (!response.ok) throw new Error('route')
      const data = await response.json()
      const path = data.routes?.[0]
      if (!path?.geometry?.coordinates?.length) throw new Error('route')
      const latLngs = path.geometry.coordinates.map(([lon, lat]) => [lat, lon])
      line.setLatLngs(latLngs)
      line.setStyle({ dashArray: null })
      setRoute({
        facilityId: facility.id,
        loading: false,
        mode,
        km: path.distance / 1000,
        minutes: Math.max(1, Math.round(path.duration / 60)),
        straight: false,
      })
      map.fitBounds(line.getBounds(), { padding: [48, 48], maxZoom: 16 })
    } catch {
      if (token !== routeTokenRef.current) return
      setRoute({
        facilityId: facility.id,
        loading: false,
        mode,
        km: facility.dist,
        minutes: null,
        straight: true,
      })
      map.fitBounds(line.getBounds(), { padding: [48, 48], maxZoom: 16 })
    }
  }

  function focusFacility(facility) {
    routeTo(facility)
  }

  function acceptPosition(map, pos, source) {
    if (!aliveRef.current || mapRef.current !== map) return
    const next = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy || 0),
      source,
    }
    if (!insideGambia(next.lat, next.lon)) {
      setLocationNote('Your position is outside The Gambia, so the map is still centred on the country.')
      return
    }

    const previous = userPosRef.current
    const moved = !previous || distanceKm(previous.lat, previous.lon, next.lat, next.lon) > 0.4
    const sharper = !previous || next.accuracy + 20 < previous.accuracy
    userPosRef.current = next
    setUserPos(next)
    measuredRef.current = 'user'
    setMeasuredFrom('user')
    setLocationNote('')
    if (!previous || moved || sharper) drawUser(map, next)
    if (!moved && previous) return

    if (!radiusPickedRef.current) {
      radiusRef.current = 20
      setSearchRadius(20)
    }
    const list = showFacilities(map, next.lat, next.lon, radiusRef.current)
    if (list.length) {
      const bounds = L.latLngBounds(list.map((facility) => [facility.lat, facility.lon]))
      bounds.extend([next.lat, next.lon])
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 })
    } else {
      map.setView([next.lat, next.lon], 14)
    }
  }

  function useFallback(map, note) {
    if (!aliveRef.current || mapRef.current !== map) return
    setLocating(false)
    setLocationNote(note)
    measuredRef.current = 'banjul'
    setMeasuredFrom('banjul')
    userPosRef.current = null
    setUserPos(null)
    if (userMarkerRef.current) userMarkerRef.current.remove()
    if (accuracyRef.current) accuracyRef.current.remove()
    const list = showFacilities(map, BANJUL.lat, BANJUL.lon, radiusRef.current)
    if (radiusRef.current == null && list.length) {
      map.fitBounds(L.latLngBounds(list.map((facility) => [facility.lat, facility.lon])), { padding: [36, 36] })
    } else {
      map.setView([BANJUL.lat, BANJUL.lon], 12)
    }
  }

  function locateUser(map) {
    const target = map || mapRef.current
    if (!target) return
    setLocating(true)

    if (!navigator.geolocation) {
      useFallback(target, 'This browser cannot read where you are standing. Allow location, then tap Relocate.')
      return
    }

    const onFix = (pos, source) => {
      setLocating(false)
      acceptPosition(target, pos, source)
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onFix(pos, (pos.coords.accuracy || 9999) <= 100 ? 'gps' : 'network')
        if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = navigator.geolocation.watchPosition(
          (better) => {
            const current = userPosRef.current
            if (!current || better.coords.accuracy <= current.accuracy + 5) {
              acceptPosition(target, better, 'gps')
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
        )
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => onFix(pos, 'network'),
          () => useFallback(target, 'Location is blocked. Allow it, then tap Relocate, so directions start where you are standing.'),
          { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
        )
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    )
  }

  function handleRadiusChange(nextRadius) {
    radiusPickedRef.current = true
    setSearchRadius(nextRadius)
    radiusRef.current = nextRadius
    const map = mapRef.current
    const origin = userPosRef.current || BANJUL
    if (!map) return
    clearRoute()
    setSelectedId(null)
    const list = showFacilities(map, origin.lat, origin.lon, nextRadius)
    if (!list.length) return
    const bounds = L.latLngBounds(list.map((facility) => [facility.lat, facility.lon]))
    if (userPosRef.current) bounds.extend([userPosRef.current.lat, userPosRef.current.lon])
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: nextRadius == null ? 9 : 14 })
  }

  useEffect(() => {
    if (!open || mapRef.current || !containerRef.current) return

    aliveRef.current = true
    const map = L.map(containerRef.current, { center: GAMBIA_CENTER, zoom: 8, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    map.setMaxBounds(L.latLngBounds(
      [GAMBIA_BOUNDS.south - 0.4, GAMBIA_BOUNDS.west - 0.4],
      [GAMBIA_BOUNDS.north + 0.4, GAMBIA_BOUNDS.east + 0.4],
    ))
    facilityLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    showFacilities(map, GAMBIA_CENTER[0], GAMBIA_CENTER[1], null)
    map.fitBounds(L.latLngBounds(
      [GAMBIA_BOUNDS.south, GAMBIA_BOUNDS.west],
      [GAMBIA_BOUNDS.north, GAMBIA_BOUNDS.east],
    ))
    locateUser(map)

    const resize = () => map.invalidateSize()
    window.addEventListener('resize', resize)
    const timer = setTimeout(resize, 250)

    return () => {
      aliveRef.current = false
      clearTimeout(timer)
      window.removeEventListener('resize', resize)
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
      routeTokenRef.current += 1
      map.remove()
      mapRef.current = null
      facilityLayerRef.current = null
      userMarkerRef.current = null
      accuracyRef.current = null
      routeLayerRef.current = null
    }
  // Mount the map once per open. Helpers close over refs, not stale facility state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    facilityLayerRef.current?.eachLayer((layer) => {
      if (layer.facility) layer.setPopupContent(popupHtml(layer.facility, isDark, measuredFrom !== 'country'))
    })
  }, [isDark, facilities])

  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.invalidateSize(), 50)
    return () => clearTimeout(timer)
  }, [selectedId, open])

  if (!open) return null

  const showDistance = measuredFrom === 'user' || measuredFrom === 'banjul'
  const distanceLabel = measuredFrom === 'user' ? 'from you' : 'from Banjul'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white leading-tight">Health Centers Near You</p>
            <p className="truncate text-[10px] text-green-100">
              {locating ? 'Finding where you are standing…' : userPos ? `You are here · accurate to about ${userPos.accuracy || 30} m` : 'The Gambia'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-green-100 hover:bg-white/20 transition" aria-label="Close map">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 sm:px-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">Radius:</span>
          {[5, 10, 20, 50, null].map((radius) => (
            <button
              key={radius ?? 'all'}
              onClick={() => handleRadiusChange(radius)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                searchRadius === radius
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-green-900/40 dark:hover:text-green-400'
              }`}
            >
              {radius == null ? 'All' : `${radius} km`}
            </button>
          ))}
        </div>
        <button
          onClick={() => locateUser()}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition dark:bg-green-900/30 dark:text-green-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {locating ? 'Locating…' : 'Relocate me'}
        </button>
      </div>

      {locationNote && (
        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {locationNote}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden md:flex w-72 min-w-0 shrink-0 flex-col border-r border-gray-100 bg-slate-50 lg:w-80 dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {status === 'ready' ? `${facilities.length} places` : 'Health facilities'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {widened
                ? `Nothing inside ${searchRadius} km. Showing the nearest places.`
                : showDistance
                  ? `Distance is ${distanceLabel}. Tap a place for the road from where you are standing.`
                  : 'Tap a place, or allow location so the route starts where you are standing.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {[
                { color: 'bg-red-500', label: 'Hospital' },
                { color: 'bg-emerald-600', label: 'Clinic' },
                { color: 'bg-blue-600', label: 'Pharmacy' },
                { color: 'bg-blue-600', label: 'You', dot: true },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${item.color} ${item.dot ? 'ring-2 ring-blue-200' : ''}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <FacilityList
            facilities={facilities}
            selectedId={selectedId}
            status={status}
            errorMsg={errorMsg}
            showDistance={showDistance}
            onPick={focusFacility}
          />
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <div ref={containerRef} className="h-full w-full" />
            {selected && (
              <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-2xl bg-white p-3 shadow-xl dark:bg-slate-800 md:left-auto md:w-80">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{selected.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selected.label}{selected.place ? ` · ${selected.place}` : ''}{showDistance ? ` · ${selected.dist.toFixed(1)} km ${distanceLabel}` : ''}
                    </p>
                  </div>
                  <button onClick={() => { setSelectedId(null); clearRoute() }} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close place">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {['driving', 'foot'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setTravelMode(mode); routeTo(selected, mode) }}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        travelMode === mode ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {mode === 'driving' ? 'Drive' : 'Walk'}
                    </button>
                  ))}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {route?.loading && 'Finding the road…'}
                    {route && !route.loading && !route.straight && `${route.minutes} min · ${route.km.toFixed(1)} km by road`}
                    {route && !route.loading && route.straight && `${route.km.toFixed(1)} km in a straight line`}
                    {!route && !userPos && 'Allow location to route from where you stand.'}
                  </p>
                </div>
                <a
                  href={directionsUrl(userPos, selected, travelMode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                >
                  Directions from where I am
                </a>
              </div>
            )}
          </div>

          <div className="max-h-40 overflow-y-auto border-t border-gray-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 md:hidden">
            <FacilityList
              facilities={facilities}
              selectedId={selectedId}
              status={status}
              errorMsg={errorMsg}
              showDistance={showDistance}
              onPick={focusFacility}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FacilityList({ facilities, selectedId, status, errorMsg, showDistance, onPick }) {
  if (status === 'error') {
    return <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{errorMsg}</div>
  }
  if (!facilities.length) {
    return <p className="px-4 py-8 text-center text-sm text-slate-400">No health facilities to show yet.</p>
  }
  return (
    <div className="flex-1 overflow-y-auto">
      {facilities.map((facility) => (
        <button
          key={facility.id}
          onClick={() => onPick(facility)}
          className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-white dark:border-slate-700 dark:hover:bg-slate-700 ${
            selectedId === facility.id ? 'bg-green-50 dark:bg-green-900/30' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-white">{facility.name}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {facility.label}{facility.place ? ` · ${facility.place}` : ''}
              </p>
            </div>
            {showDistance && (
              <span className="flex-shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                {facility.dist.toFixed(1)} km
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
