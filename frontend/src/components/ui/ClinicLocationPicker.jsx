import { useEffect, useRef, useState } from 'react';

// Leaflet is loaded dynamically to avoid SSR issues
let L = null;

const loadLeaflet = async () => {
  if (L) return L;
  const leaflet = await import('leaflet');
  L = leaflet.default || leaflet;

  // Fix default marker icon paths broken by bundlers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  return L;
};

/**
 * ClinicLocationPicker
 *
 * Props:
 *   latitude  {string|number}  current lat value
 *   longitude {string|number}  current lng value
 *   onPin     {(lat, lng) => void}  called when user clicks map or uses current location
 */
const ClinicLocationPicker = ({ latitude, longitude, onPin }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet CSS once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Init map
  useEffect(() => {
    let mounted = true;

    loadLeaflet().then((leaflet) => {
      if (!mounted || !mapContainerRef.current || mapRef.current) return;

      const defaultLat = latitude ? Number(latitude) : 20.5937;
      const defaultLng = longitude ? Number(longitude) : 78.9629;
      const zoom = latitude && longitude ? 15 : 5;

      const map = leaflet.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      // Place marker if coords already set
      if (latitude && longitude) {
        const marker = leaflet
          .marker([Number(latitude), Number(longitude)], { draggable: true })
          .addTo(map)
          .bindPopup('Clinic location')
          .openPopup();

        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onPin(lat.toFixed(6), lng.toFixed(6));
        });

        markerRef.current = marker;
      }

      // Click to pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = leaflet
            .marker([lat, lng], { draggable: true })
            .addTo(map)
            .bindPopup('Clinic location')
            .openPopup();

          marker.on('dragend', (ev) => {
            const pos = ev.target.getLatLng();
            onPin(pos.lat.toFixed(6), pos.lng.toFixed(6));
          });

          markerRef.current = marker;
        }

        onPin(lat.toFixed(6), lng.toFixed(6));
      });

      mapRef.current = map;
      setLeafletReady(true);
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker when lat/lng changes externally (e.g. "Use Current Location")
  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;
    if (!latitude || !longitude) return;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      loadLeaflet().then((leaflet) => {
        if (!mapRef.current) return;
        const marker = leaflet
          .marker([lat, lng], { draggable: true })
          .addTo(mapRef.current)
          .bindPopup('Clinic location')
          .openPopup();

        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          onPin(pos.lat.toFixed(6), pos.lng.toFixed(6));
        });

        markerRef.current = marker;
      });
    }

    mapRef.current.setView([lat, lng], 15);
  }, [latitude, longitude, leafletReady, onPin]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onPin(coords.latitude.toFixed(6), coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      () => {
        alert('Unable to fetch your current location. Please pin manually on the map.');
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-base">📍</span>
          {latitude && longitude ? (
            <span className="font-semibold text-slate-800">
              {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
            </span>
          ) : (
            <span>Click on the map to pin your clinic location</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {latitude && longitude ? (
            <button
              type="button"
              onClick={() => onPin('', '')}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-500"
            >
              Clear pin
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                Locating...
              </>
            ) : (
              <>
                <span>🎯</span>
                Use my location
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        {!leafletReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <span className="text-sm">Loading map...</span>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} style={{ height: '320px', width: '100%' }} />
      </div>

      {/* Hint */}
      <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        Click anywhere on the map to drop a pin · Drag the pin to adjust · Or use "Use my location"
      </div>
    </div>
  );
};

export default ClinicLocationPicker;
