import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Compass, 
  RefreshCw, 
  Activity, 
  Radio, 
  ShieldAlert, 
  Phone, 
  Star, 
  Clock, 
  Building2, 
  Filter, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useUserLocation } from '../../hooks/useUserLocation';
import { getNearbyHospitals } from '../../services/nearbyHospitalsService';
import { NearbyHospital } from '../../types/nearbyHospital';
import { useMedFlow } from '../../context/MedFlowContext';

interface FindHospitalsPanelProps {
  onHospitalsLoaded?: (hospitals: NearbyHospital[]) => void;
  onHospitalSelect?: (hospital: NearbyHospital) => void;
  selectedHospitalId?: string | null;
}

export const FindHospitalsPanel: React.FC<FindHospitalsPanelProps> = ({
  onHospitalsLoaded,
  onHospitalSelect,
  selectedHospitalId,
}) => {
  const {
    userLocation,
    locationPermission,
    isLocating,
    isLiveTracking,
    error,
    requestLocation,
    startLiveTracking,
    stopLiveTracking,
  } = useUserLocation();

  const { facilities } = useMedFlow();

  const [searchRadius, setSearchRadius] = useState<number>(10);
  const [nearbyHospitals, setNearbyHospitals] = useState<NearbyHospital[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch nearby hospitals when user location changes or radius changes
  useEffect(() => {
    if (!userLocation) return;

    let isMounted = true;
    setIsSearching(true);

    getNearbyHospitals(
      userLocation.latitude,
      userLocation.longitude,
      searchRadius,
      facilities
    )
      .then(hospitals => {
        if (isMounted) {
          setNearbyHospitals(hospitals);
          onHospitalsLoaded?.(hospitals);
          setIsSearching(false);
        }
      })
      .catch(err => {
        console.error('Error finding nearby hospitals:', err);
        if (isMounted) setIsSearching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userLocation?.latitude, userLocation?.longitude, searchRadius, facilities]);

  const filteredHospitals = nearbyHospitals.filter(h => {
    if (filterType === 'hospital') return h.type.toLowerCase().includes('hospital');
    if (filterType === 'clinic') return h.type.toLowerCase().includes('clinic');
    if (filterType === 'emergency') return h.type.toLowerCase().includes('emergency');
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Header & Location Controls Card */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-white text-sm tracking-tight">
              Find Hospitals Near Me
            </h3>
          </div>
          {userLocation && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              GPS Active
            </span>
          )}
        </div>

        {/* Permission Request Prompt */}
        {!userLocation && (
          <div className="space-y-3 py-2 text-center">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">📍 Real Device Geolocation Required</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                MedFlow AI needs your location to find nearby emergency hospitals, medical centers, and clinics based on your exact latitude and longitude.
              </p>
            </div>

            <button
              onClick={requestLocation}
              disabled={isLocating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Obtaining GPS Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>📍 Find Hospitals Near Me</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error / Permission Denied Message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 space-y-1.5 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-200">Location Access Issue</p>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">{error}</p>
              {locationPermission === 'denied' && (
                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  Tip: Click the lock icon in your browser URL bar to allow location permissions.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Location Info Header & Controls when Location is Granted */}
        {userLocation && (
          <div className="space-y-3">
            {/* User GPS Telemetry Panel */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-800/50 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">📍 Device Position:</span>
                <span className="text-cyan-300 font-bold">
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="text-slate-400">Accuracy:</span>
                <span className="text-emerald-400 font-bold">± {userLocation.accuracy} meters</span>
              </div>
            </div>

            {/* Controls Bar: Refresh & Live Location Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={requestLocation}
                disabled={isLocating}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Refresh Location</span>
              </button>

              <button
                onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isLiveTracking
                    ? 'bg-rose-950/80 border-rose-700 text-rose-300 hover:bg-rose-900/80'
                    : 'bg-cyan-950/80 border-cyan-700 text-cyan-300 hover:bg-cyan-900/80'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveTracking ? 'animate-pulse text-rose-400' : ''}`} />
                <span>{isLiveTracking ? '⏹ Stop Live GPS' : '📡 Enable Live GPS'}</span>
              </button>
            </div>

            {/* Radius & Type Filter */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[11px]">Search Radius:</span>
                <select
                  value={searchRadius}
                  onChange={e => setSearchRadius(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2 py-1 text-xs font-mono focus:outline-none"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="all">All Facilities</option>
                <option value="hospital">Hospitals</option>
                <option value="emergency">Emergency</option>
                <option value="clinic">Clinics</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 2. Sorted Nearby Hospitals List */}
      {userLocation && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Nearby Healthcare Facilities ({filteredHospitals.length})
            </h3>
            {isSearching && (
              <span className="text-[10px] text-cyan-400 font-mono animate-pulse flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Searching...
              </span>
            )}
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredHospitals.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No facilities found within {searchRadius} km radius.</p>
                <p className="text-[11px] text-slate-500">Try expanding the search radius above.</p>
              </div>
            ) : (
              filteredHospitals.map(hosp => {
                const isSelected = selectedHospitalId === hosp.id;
                return (
                  <div
                    key={hosp.id}
                    onClick={() => onHospitalSelect?.(hosp)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-white flex items-center gap-1">
                          {hosp.type === 'Emergency Hospital' ? '🚨 ' : '🏥 '}
                          {hosp.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{hosp.address}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 block">
                          📍 {hosp.distanceFormatted}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                          {hosp.source}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80 text-slate-300 font-mono">
                      <div className="flex items-center gap-2">
                        {hosp.rating && (
                          <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" /> {hosp.rating.toFixed(1)}
                          </span>
                        )}
                        {hosp.isOpenNow !== undefined && (
                          <span className={hosp.isOpenNow ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                            {hosp.isOpenNow ? 'Open' : 'Closed'}
                          </span>
                        )}
                        {hosp.phoneNumber && (
                          <span className="text-cyan-400 flex items-center gap-0.5">
                            <Phone className="w-3 h-3" /> Call
                          </span>
                        )}
                      </div>

                      <a
                        href={hosp.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Directions</span>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
