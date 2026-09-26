import React, { useEffect, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Star, 
  Navigation, 
  Clock 
} from 'lucide-react';
import { NearbyHospital } from '../../types/nearbyHospital';

// Create custom hospital icon for nearby discovered hospitals
const createNearbyHospitalIcon = (type: NearbyHospital['type'], isSelected?: boolean) => {
  const color = type === 'Clinic' ? '#06b6d4' : type === 'Emergency Hospital' ? '#f43f5e' : '#10b981';
  const size = isSelected ? 42 : 34;
  const height = isSelected ? 52 : 44;
  const borderStroke = isSelected ? '#38bdf8' : color;

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 34 44">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
      <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 27 17 27s17-14.25 17-27C34 7.611 26.389 0 17 0z" fill="${color}" stroke="${borderStroke}" stroke-width="${isSelected ? 2 : 0}" filter="url(#shadow)"/>
      <circle cx="17" cy="17" r="11" fill="#0f172a"/>
      <path d="M17 9.5v15M9.5 17h15" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `;

  return L.divIcon({
    className: `custom-nearby-hospital-pin ${isSelected ? 'marker-selected' : ''}`,
    html: svgString,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height + 4],
  });
};

interface NearbyHospitalMarkerProps {
  hospital: NearbyHospital;
  isSelected?: boolean;
  onSelect?: (hospital: NearbyHospital) => void;
}

export const NearbyHospitalMarker: React.FC<NearbyHospitalMarkerProps> = ({
  hospital,
  isSelected,
  onSelect,
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  const map = useMap();

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
      map.flyTo([hospital.lat, hospital.lng], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 0.8,
      });
    }
  }, [isSelected, hospital.lat, hospital.lng, map]);

  return (
    <Marker
      ref={markerRef}
      position={[hospital.lat, hospital.lng]}
      icon={createNearbyHospitalIcon(hospital.type, isSelected)}
      eventHandlers={{
        click: () => onSelect?.(hospital),
      }}
    >
      <Popup className="medflow-map-popup">
        <div className="p-1 w-72 text-slate-100 space-y-2">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5 leading-snug">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {hospital.name}
              </h4>
              <span className="text-[10px] font-semibold text-emerald-400 font-mono">
                📍 {hospital.distanceFormatted} away
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700 shrink-0">
              {hospital.type}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-start gap-1.5 text-slate-400 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{hospital.address}</span>
            </div>

            {hospital.rating && (
              <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{hospital.rating.toFixed(1)}</span>
                {hospital.userRatingsTotal && (
                  <span className="text-slate-400 font-normal">({hospital.userRatingsTotal} reviews)</span>
                )}
              </div>
            )}

            {hospital.isOpenNow !== undefined && (
              <div className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className={hospital.isOpenNow ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                  {hospital.isOpenNow ? '🟢 Open Now' : '🔴 Closed'}
                </span>
              </div>
            )}

            {hospital.phoneNumber && (
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <a href={`tel:${hospital.phoneNumber}`} className="hover:underline">
                  {hospital.phoneNumber}
                </a>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <a
              href={hospital.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" />
              Get Directions
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

