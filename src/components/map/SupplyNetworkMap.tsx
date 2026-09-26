import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowRight, 
  Sparkles, 
  Pill, 
  ExternalLink,
  ShieldAlert,
  Compass,
  MapPin,
  Layers
} from 'lucide-react';
import { useMedFlow } from '../../context/MedFlowContext';
import { Facility, TransferRecommendation } from '../../types/medflow';
import { UserLocation, NearbyHospital } from '../../types/nearbyHospital';
import { UserLocationMarker } from './UserLocationMarker';
import { NearbyHospitalMarker } from './NearbyHospitalMarker';

// Create custom colored markers using SVG icons
const createCustomIcon = (status: Facility['status']) => {
  const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';
  const pulseClass = status === 'critical' ? 'critical-pulse-marker' : '';

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.059 27.941 0 18 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="12" fill="#0f172a"/>
      <path d="M18 10v16M10 18h16" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
    </svg>
  `;

  return L.divIcon({
    className: `custom-map-pin ${pulseClass}`,
    html: svgString,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
  });
};

interface MapProps {
  height?: string;
  showDetailsDrawer?: boolean;
  userLocation?: UserLocation | null;
  nearbyHospitals?: NearbyHospital[];
  selectedHospitalId?: string | null;
  onHospitalSelect?: (hospital: NearbyHospital) => void;
}

export const SupplyNetworkMap: React.FC<MapProps> = ({ 
  height = '500px',
  userLocation,
  nearbyHospitals = [],
  selectedHospitalId,
  onHospitalSelect,
}) => {
  const { facilities, inventory, recommendations, approveTransfer, setSelectedFacilityId } = useMedFlow();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [activeLayer, setActiveLayer] = useState<'both' | 'regional' | 'nearby'>('both');

  // Map center coordinates (New York / Tri-State Healthcare cluster or User Location)
  const defaultCenter: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [40.735, -73.97];

  const pendingRecs = recommendations.filter(r => r.status === 'pending');

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl glass-panel">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Status Legend */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg">
          <span className="font-semibold text-slate-200 hidden sm:inline">Facility Status:</span>
          <div className="flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Healthy
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> At Risk
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Critical
            </span>
          </div>
        </div>

        {/* Map Layers Toggle */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-xs shadow-lg font-mono">
          <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Layer:
          </span>
          {[
            { id: 'both', label: 'All Markers' },
            { id: 'regional', label: 'Regional System' },
            { id: 'nearby', label: `Nearby (${nearbyHospitals.length})` },
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeLayer === layer.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. User Location Marker & Accuracy Circle */}
        {userLocation && (
          <UserLocationMarker userLocation={userLocation} autoCenter={true} />
        )}

        {/* 2. Discovered Nearby Hospitals Markers */}
        {(activeLayer === 'both' || activeLayer === 'nearby') &&
          nearbyHospitals.map(hosp => (
            <NearbyHospitalMarker
              key={hosp.id}
              hospital={hosp}
              isSelected={selectedHospitalId === hosp.id}
              onSelect={onHospitalSelect}
            />
          ))}

        {/* 3. Regional MedFlow Facility Markers */}
        {(activeLayer === 'both' || activeLayer === 'regional') &&
          facilities.map(facility => {
            const facInventory = inventory.filter(i => i.facilityId === facility.id);
            const criticalItems = facInventory.filter(i => i.status === 'critical');

            return (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
                icon={createCustomIcon(facility.status)}
                eventHandlers={{
                  click: () => {
                    setSelectedFacility(facility);
                    setSelectedFacilityId(facility.id);
                  },
                }}
              >
                <Popup className="medflow-map-popup">
                  <div className="p-1 w-72 text-slate-100">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                          {facility.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">{facility.location}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          facility.status === 'critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-700'
                            : facility.status === 'warning'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {facility.status} ({facility.riskScore}%)
                      </span>
                    </div>

                    {/* Stock metrics summary */}
                    <div className="space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between text-slate-300">
                        <span>Monitored Medicines:</span>
                        <span className="font-mono text-white">{facInventory.length} items</span>
                      </div>
                      {criticalItems.length > 0 && (
                        <div className="flex justify-between text-rose-400 font-semibold bg-rose-950/40 p-1 rounded border border-rose-900">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Critical Stockouts:
                          </span>
                          <span className="font-mono">{criticalItems.length} items</span>
                        </div>
                      )}
                      {facInventory.map(item => (
                        <div
                          key={item.medicineId}
                          className="flex justify-between items-center text-[11px] py-0.5 border-b border-slate-800/60"
                        >
                          <span className="text-slate-300">{item.medicineName}</span>
                          <span className="font-mono text-slate-400">
                            {item.currentStock} units ({item.daysUntilStockout}d left)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 4. Animated Polyline Transfer Connections */}
        {(activeLayer === 'both' || activeLayer === 'regional') &&
          pendingRecs.map(rec => {
            const recipient = facilities.find(f => f.id === rec.recipientFacilityId);
            const donor = facilities.find(f => f.id === rec.donorFacilityId);

            if (!recipient || !donor) return null;

            const polylineCoords: [number, number][] = [
              [donor.lat, donor.lng],
              [recipient.lat, recipient.lng],
            ];

            return (
              <React.Fragment key={rec.id}>
                <Polyline
                  positions={polylineCoords}
                  pathOptions={{
                    color: '#38bdf8',
                    weight: 4,
                    opacity: 0.85,
                    dashArray: '8, 8',
                  }}
                  className="animated-transfer-line"
                >
                  <Tooltip sticky permanent direction="center" className="transfer-tooltip">
                    <div className="glass-panel p-2 rounded-lg text-xs font-semibold text-slate-100 flex items-center gap-2 border border-cyan-500/50 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>
                        {donor.name.split(' ')[0]} ➔ {recipient.name.split(' ')[0]}
                      </span>
                      <span className="bg-cyan-950 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-800">
                        {rec.recommendedTransferUnits} {rec.medicineName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({rec.donorTravelTimeHours}h transit)
                      </span>
                    </div>
                  </Tooltip>
                </Polyline>
              </React.Fragment>
            );
          })}
      </MapContainer>
    </div>
  );
};
