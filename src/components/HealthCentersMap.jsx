import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useDarkMode } from '../hooks/useDarkMode'

// ── Fix Leaflet's default marker icon paths broken by bundlers ────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// ── Custom coloured icons ─────────────────────────────────────────────────────
function makeIcon(color) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`)
  return L.divIcon({
    html: `<img src="data:image/svg+xml,${svg}" width="24" height="36" />`,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  })
}

const ICONS = {
  hospital:   makeIcon('#dc2626'),  // red
  clinic:     makeIcon('#059669'),  // green
  pharmacy:   makeIcon('#2563eb'),  // blue
  health:     makeIcon('#7c3aed'),  // purple
  user:       makeIcon('#f59e0b'),  // amber — user location
}

// ── Facility type labels ──────────────────────────────────────────────────────
const TYPE_LABEL = {
  hospital:    { label: 'Hospital',          icon: ICONS.hospital },
  clinic:      { label: 'Clinic',            icon: ICONS.clinic   },
  pharmacy:    { label: 'Pharmacy',          icon: ICONS.pharmacy },
  health_post: { label: 'Health Post',       icon: ICONS.health   },
  health:      { label: 'Health Centre',     icon: ICONS.health   },
  doctors:     { label: "Doctor's Office",   icon: ICONS.clinic   },
  dentist:     { label: 'Dentist',           icon: ICONS.clinic   },
}

// ── Gambia bounding box ───────────────────────────────────────────────────────
const GAMBIA_BOUNDS = {
  south: 13.065,
  west: -16.825,
  north: 13.825,
  east: -13.797,
}
const GAMBIA_CENTER = [13.4432, -15.3101]

// ── Overpass query: all healthcare amenities inside The Gambia ────────────────
async function fetchHealthFacilities(lat, lon, radiusKm = 20) {
  const r = radiusKm * 1000
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|pharmacy|health_post|doctors|dentist"](around:${r},${lat},${lon});
      way["amenity"~"hospital|clinic|pharmacy|health_post|doctors|dentist"](around:${r},${lat},${lon});
      node["healthcare"~"hospital|clinic|pharmacy|health_post|centre|doctor|dentist"](around:${r},${lat},${lon});
      way["healthcare"~"hospital|clinic|pharmacy|health_post|centre|doctor|dentist"](around:${r},${lat},${lon});
    );
    out center;
  `.trim()

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error('Overpass API error: ' + res.status)
  const data = await res.json()
  return data.elements
}

// ── Utility: clamp coords to Gambia bounds ────────────────────────────────────
function clampToGambia(lat, lon) {
  return [
    Math.max(GAMBIA_BOUNDS.south, Math.min(GAMBIA_BOUNDS.north, lat)),
    Math.max(GAMBIA_BOUNDS.west,  Math.min(GAMBIA_BOUNDS.east,  lon)),
  ]
}

// ── Distance in km (Haversine) ────────────────────────────────────────────────
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HealthCentersMap({ open, onClose }) {
  const mapRef      = useRef(null)   // Leaflet map instance
  const containerRef = useRef(null)  // DOM div
  const userMarkerRef = useRef(null)

  const [status, setStatus]       = useState('idle')   // idle | locating | loading | ready | error
  const [errorMsg, setErrorMsg]   = useState('')
  const [facilities, setFacilities] = useState([])
  const [selected, setSelected]   = useState(null)
  const [userPos, setUserPos]     = useState(null)
  const [searchRadius, setSearchRadius] = useState(20)

  // Get dark mode state
  const [isDark] = useDarkMode()

  // ── Generate popup content with theme-appropriate colors ─────────────────
  function createPopupContent(f) {
    const titleColor = isDark ? '#10b981' : '#059669'  // emerald-500 : emerald-600
    const labelColor = isDark ? '#94a3b8' : '#64748b'  // slate-400 : slate-500
    const textColor = isDark ? '#e2e8f0' : '#475569'   // slate-200 : slate-600
    
    return `
      <div style="min-width:180px; color: ${textColor};">
        <b style="color:${titleColor}">${f.name}</b><br/>
        <span style="font-size:12px;color:${labelColor}">${f.label}</span><br/>
        <span style="font-size:12px;color:${textColor}">📏 ${f.dist.toFixed(1)} km away</span>
        ${f.phone    ? `<br/><span style="font-size:12px;color:${textColor}">📞 ${f.phone}</span>` : ''}
        ${f.opening  ? `<br/><span style="font-size:12px;color:${textColor}">🕐 ${f.opening}</span>` : ''}
      </div>
    `
  }

  // ── Update popup colors when theme changes ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !facilities.length) return
    
    // Update all existing popups with new theme colors
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
        const facility = facilities.find(f => 
          Math.abs(layer.getLatLng().lat - f.lat) < 0.0001 && 
          Math.abs(layer.getLatLng().lng - f.lon) < 0.0001
        )
        if (facility) {
          layer.setPopupContent(createPopupContent(facility))
        }
      }
    })
  }, [isDark, facilities])

  // ── Initialise map once ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: GAMBIA_CENTER,
      zoom: 8,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Restrict panning outside Gambia with a soft boundary
    const gambiaLatLngBounds = L.latLngBounds(
      [GAMBIA_BOUNDS.south - 0.5, GAMBIA_BOUNDS.west - 0.5],
      [GAMBIA_BOUNDS.north + 0.5, GAMBIA_BOUNDS.east + 0.5],
    )
    map.setMaxBounds(gambiaLatLngBounds)

    mapRef.current = map

    // Auto-locate on open
    locateUser(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ── Update user marker popup when theme changes ─────────────────────────────
  useEffect(() => {
    if (userMarkerRef.current) {
      const popup = userMarkerRef.current.getPopup()
      if (popup && popup.getContent()) {
        const currentContent = popup.getContent()
        if (currentContent.includes('Your Location')) {
          userMarkerRef.current.setPopupContent(`<b style="color: ${isDark ? '#10b981' : '#059669'}">📍 Your Location</b>`)
        } else if (currentContent.includes('Banjul')) {
          userMarkerRef.current.setPopupContent(`<b style="color: ${isDark ? '#10b981' : '#059669'}">📍 Banjul (default)</b><br/><small style="color: ${isDark ? '#94a3b8' : '#64748b'}">Enable location for better results</small>`)
        }
      }
    }
  }, [isDark])

  // ── Locate user + fetch facilities ───────────────────────────────────────
  function locateUser(map) {
    const m = map || mapRef.current
    if (!m) return
    setStatus('locating')
    setErrorMsg('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let { latitude: lat, longitude: lon } = pos.coords
        ;[lat, lon] = clampToGambia(lat, lon)

        setUserPos({ lat, lon })
        m.setView([lat, lon], 13)

        // Drop user pin
        if (userMarkerRef.current) userMarkerRef.current.remove()
        userMarkerRef.current = L.marker([lat, lon], { icon: ICONS.user })
          .addTo(m)
          .bindPopup('<b>📍 Your Location</b>')
          .openPopup()

        loadFacilities(m, lat, lon, searchRadius)
      },
      () => {
        // Geolocation denied — fallback to Banjul city centre
        const lat = 13.4549
        const lon = -16.5790
        setUserPos({ lat, lon })
        m.setView([lat, lon], 12)

        if (userMarkerRef.current) userMarkerRef.current.remove()
        userMarkerRef.current = L.marker([lat, lon], { icon: ICONS.user })
          .addTo(m)
          .bindPopup('<b>📍 Banjul (default)</b><br><small>Enable location for better results</small>')
          .openPopup()

        loadFacilities(m, lat, lon, searchRadius)
      },
      { timeout: 8000, enableHighAccuracy: true },
    )
  }

  async function loadFacilities(map, lat, lon, radius) {
    setStatus('loading')
    setFacilities([])

    // Clear old markers (except user)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
        map.removeLayer(layer)
      }
    })

    try {
      const elements = await fetchHealthFacilities(lat, lon, radius)

      const parsed = elements
        .filter((el) => {
          const elLat = el.lat ?? el.center?.lat
          const elLon = el.lon ?? el.center?.lon
          return elLat && elLon
        })
        .map((el) => {
          const elLat = el.lat ?? el.center.lat
          const elLon = el.lon ?? el.center.lon
          const tags  = el.tags || {}
          const type  =
            tags.amenity || tags.healthcare || 'health'
          const info  = TYPE_LABEL[type] || TYPE_LABEL.health
          return {
            id:       el.id,
            lat:      elLat,
            lon:      elLon,
            name:     tags.name || tags['name:en'] || 'Unnamed Facility',
            type,
            label:    info.label,
            icon:     info.icon,
            phone:    tags.phone || tags['contact:phone'] || null,
            opening:  tags.opening_hours || null,
            website:  tags.website || tags['contact:website'] || null,
            dist:     distanceKm(lat, lon, elLat, elLon),
          }
        })
        .sort((a, b) => a.dist - b.dist)

      setFacilities(parsed)

      parsed.forEach((f) => {
        const marker = L.marker([f.lat, f.lon], { icon: f.icon })
          .addTo(map)
          .bindPopup(createPopupContent(f))
        marker.on('click', () => setSelected(f))
      })

      setStatus('ready')
    } catch (e) {
      setErrorMsg('Could not load health facilities. Please try again.')
      setStatus('error')
    }
  }

  function handleRadiusChange(newRadius) {
    setSearchRadius(newRadius)
    if (userPos && mapRef.current) {
      loadFacilities(mapRef.current, userPos.lat, userPos.lon, newRadius)
    }
  }

  function flyToFacility(f) {
    setSelected(f)
    mapRef.current?.flyTo([f.lat, f.lon], 16, { duration: 1 })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Health Centers Near You</p>
            <p className="text-[10px] text-green-100">The Gambia — Live Map</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-green-100 hover:bg-white/20 transition" aria-label="Close map">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        {/* Radius selector */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-medium">Radius:</span>
          {[5, 10, 20, 50].map((r) => (
            <button
              key={r}
              onClick={() => handleRadiusChange(r)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                searchRadius === r
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-green-900/40 dark:hover:text-green-400'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>

        {/* Re-locate button */}
        <button
          onClick={() => locateUser()}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          Relocate Me
        </button>
      </div>

      {/* ── Main content: map + sidebar ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar (facility list) ── */}
        <div className="hidden md:flex w-72 flex-shrink-0 flex-col border-r border-gray-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {status === 'ready'
                ? `${facilities.length} facilities found`
                : status === 'loading' || status === 'locating'
                ? 'Searching…'
                : 'Health Facilities'}
            </p>
            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {[
                { color: 'bg-red-500',    label: 'Hospital'  },
                { color: 'bg-emerald-600', label: 'Clinic'   },
                { color: 'bg-blue-600',   label: 'Pharmacy'  },
                { color: 'bg-violet-600', label: 'Health Ctr'},
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {(status === 'locating' || status === 'loading') && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                <svg className="h-8 w-8 animate-spin text-green-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm">{status === 'locating' ? 'Getting your location…' : 'Loading facilities…'}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                ⚠ {errorMsg}
              </div>
            )}

            {status === 'ready' && facilities.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No facilities found within {searchRadius} km. Try increasing the radius.
              </p>
            )}

            {status === 'ready' && facilities.map((f) => (
              <button
                key={f.id}
                onClick={() => flyToFacility(f)}
                className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-white dark:border-slate-700 dark:hover:bg-slate-700 ${
                  selected?.id === f.id ? 'bg-green-50 dark:bg-green-900/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-white">{f.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{f.label}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                    {f.dist.toFixed(1)} km
                  </span>
                </div>
                {f.phone && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">📞 {f.phone}</p>}
                {f.opening && <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">🕐 {f.opening}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Map container ── */}
        <div className="relative flex-1">
          <div ref={containerRef} className="h-full w-full" />

          {/* Loading overlay */}
          {(status === 'locating' || status === 'loading') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-[999]">
              <svg className="h-10 w-10 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                {status === 'locating' ? 'Getting your location…' : 'Loading nearby health facilities…'}
              </p>
            </div>
          )}

          {/* Mobile: selected facility card */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 z-[999] rounded-2xl bg-white p-4 shadow-xl md:hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{selected.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selected.label} · {selected.dist.toFixed(1)} km away</p>
                  {selected.phone   && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">📞 {selected.phone}</p>}
                  {selected.opening && <p className="text-sm text-slate-500 dark:text-slate-400">🕐 {selected.opening}</p>}
                </div>
                <button onClick={() => setSelected(null)} className="ml-2 rounded-full p-1 text-slate-400 hover:bg-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selected.website && (
                <a href={selected.website} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  Visit Website ↗
                </a>
              )}
            </div>
          )}

          {/* Mobile facility count badge */}
          {status === 'ready' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] md:hidden">
              <span className="rounded-full bg-white/90 dark:bg-slate-800/90 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-md">
                {facilities.length} facilities within {searchRadius} km
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
