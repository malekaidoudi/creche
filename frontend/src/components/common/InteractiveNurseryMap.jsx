import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  ExternalLink
} from 'lucide-react';

/**
 * 🗺️ Carte Interactive Haute Fidélité pour la Crèche
 * - Vue Satellite par défaut (Google Hybrid haute résolution)
 * - Zoom rapproché dès le début (zoom 19)
 * - Repère Logo officiel ancré géographiquement (se déplace proportionnellement au zoom/drag)
 * - Bascule Plan / Satellite
 * - Bouton de recentrage instantané
 */
const InteractiveNurseryMap = ({
  latitude = 33.340592,
  longitude = 10.490699,
  nurseryName = 'Crèche Mima Elghalia',
  address = '9 Rue Latif Ksiksi, Médenine 4100',
  isRTL = false,
  className = ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const streetsLayerRef = useRef(null);

  const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'streets'

  const LAT = Number(latitude) || 33.340592;
  const LNG = Number(longitude) || 10.490699;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Éviter la réinitialisation si déjà présent
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 1. Initialiser la carte Leaflet centrée sur la crèche à zoom 19
    const map = L.map(mapContainerRef.current, {
      center: [LAT, LNG],
      zoom: 19,
      minZoom: 13,
      maxZoom: 21,
      zoomControl: false // Nous utilisons des contrôles personnalisés ou placés proprement
    });

    mapInstanceRef.current = map;

    // Contrôleur de zoom en bas à droite
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 2. Couche Satellite Hybride Google (Photos satellite + routes et noms des rues)
    const satelliteLayer = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        maxZoom: 21,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satellite'
      }
    );
    satelliteLayerRef.current = satelliteLayer;

    // 3. Couche Plan / Rues (OpenStreetMap Carto)
    const streetsLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }
    );
    streetsLayerRef.current = streetsLayer;

    // Activer la vue satellite par défaut
    satelliteLayer.addTo(map);

    // 4. Créer le Repère Personnalisé avec Logo officiel
    // L'ancrage (iconAnchor) est calibré exactement au pixel près sur la pointe inférieure
    const pinHtml = `
      <div class="nursery-leaflet-marker" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 180px;
        pointer-events: auto;
        cursor: pointer;
        user-select: none;
      ">
        <!-- Bulle d'information supérieure -->
        <div style="
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(8px);
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 12px;
          box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: system-ui, -apple-system, sans-serif;
          white-space: nowrap;
          margin-bottom: 5px;
          transition: transform 0.2s ease;
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 8px #10b981;"></span>
          <span style="font-size: 11px; font-weight: 700; letter-spacing: -0.2px;">${nurseryName}</span>
        </div>

        <!-- Pastille Logo Crèche avec onde de pulsation -->
        <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
          <!-- Onde pulsante -->
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: rgba(99, 102, 241, 0.45);
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>

          <!-- Cercle avec photo logo -->
          <div style="
            position: relative;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid #6366f1;
            box-shadow: 0 8px 20px -2px rgba(0, 0, 0, 0.6);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <img
              src="/images/logo.jpg"
              alt="${nurseryName}"
              style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
            />
          </div>
        </div>

        <!-- Pointe flèche du repère -->
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 11px solid #6366f1;
          margin-top: -2px;
          filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.5));
        "></div>
      </div>
    `;

    // Hauteur totale approximative : bulle (~26px) + margin (5px) + badge (50px) + pointe (11px - 2px) = 90px
    // Largeur du conteneur = 180px
    // Le centre horizontal est à 90px, et le bas de la pointe est à 90px
    const customIcon = L.divIcon({
      html: pinHtml,
      className: 'nursery-custom-logo-icon',
      iconSize: [180, 90],
      iconAnchor: [90, 90], // La pointe du bas touche exactement les coordonnées GPS
      popupAnchor: [0, -92]
    });

    const marker = L.marker([LAT, LNG], {
      icon: customIcon,
      riseOnHover: true
    }).addTo(map);

    markerRef.current = marker;

    // Popup informative au clic sur le marqueur
    const popupContent = `
      <div style="font-family: system-ui, sans-serif; padding: 4px 2px; min-width: 180px; text-align: center;">
        <div style="font-weight: 800; font-size: 13px; color: #1e293b; margin-bottom: 2px;">${nurseryName}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${address}</div>
        <div style="margin-top: 4px;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}" target="_blank" rel="noopener noreferrer" style="
            display: inline-block;
            background: #4f46e5;
            color: #ffffff;
            font-size: 11px;
            font-weight: 600;
            text-decoration: none;
            padding: 5px 12px;
            border-radius: 8px;
          ">
            ${isRTL ? 'بدء الإرشاد GPS' : 'Démarrer l\'itinéraire'}
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);

    // Nettoyage lors du démontage
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [LAT, LNG, nurseryName, address, isRTL]);

  // Basculer entre Satellite et Plan
  const toggleMapLayer = (type) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (type === 'satellite') {
      if (streetsLayerRef.current && map.hasLayer(streetsLayerRef.current)) {
        map.removeLayer(streetsLayerRef.current);
      }
      if (satelliteLayerRef.current && !map.hasLayer(satelliteLayerRef.current)) {
        satelliteLayerRef.current.addTo(map);
      }
      setMapType('satellite');
    } else {
      if (satelliteLayerRef.current && map.hasLayer(satelliteLayerRef.current)) {
        map.removeLayer(satelliteLayerRef.current);
      }
      if (streetsLayerRef.current && !map.hasLayer(streetsLayerRef.current)) {
        streetsLayerRef.current.addTo(map);
      }
      setMapType('streets');
    }
  };

  // Recentrer la carte instantanément sur la crèche
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([LAT, LNG], 19, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  };

  // URL Google Maps externe pour consultation
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${LAT},${LNG}`;

  return (
    <div className={`relative w-full h-full min-h-[440px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 ${className}`}>
      {/* Conteneur DOM pour Leaflet */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[440px] z-10"
        style={{ background: '#0f172a' }}
      />

      {/* Style CSS injecté pour l'animation de pulsation Leaflet */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .nursery-custom-logo-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>

      {/* 🎛️ Barre d'outils flottante en haut à gauche/droite */}
      <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Sélecteur Satellite / Plan */}
        <div className="p-1 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl flex items-center gap-1 text-xs">
          <button
            onClick={() => toggleMapLayer('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              mapType === 'satellite'
                ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🛰️</span>
            <span>{isRTL ? 'قمر صناعي' : 'Satellite'}</span>
          </button>
          <button
            onClick={() => toggleMapLayer('streets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              mapType === 'streets'
                ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🗺️</span>
            <span>{isRTL ? 'خريطة' : 'Plan'}</span>
          </button>
        </div>

        {/* Bouton Recentrer */}
        <button
          onClick={handleRecenter}
          className="p-2.5 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md text-white rounded-2xl border border-white/20 shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-semibold"
          title={isRTL ? 'إعادة التوسيط على الروضة' : 'Recadrer sur la crèche'}
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">{isRTL ? 'توسيط' : 'Recadrer'}</span>
        </button>
      </div>

      {/* 🚀 Bouton Plein Écran / Google Maps en haut à droite */}
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 pointer-events-auto">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md text-white rounded-2xl border border-white/20 shadow-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5 text-primary-400" />
          <span>{isRTL ? 'فتح في خرائط جوجل' : 'Google Maps'}</span>
        </a>
      </div>
    </div>
  );
};

export default InteractiveNurseryMap;
