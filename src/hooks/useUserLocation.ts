import { useState, useEffect, useRef, useCallback } from 'react';
import { UserLocation, GeolocationState } from '../types/nearbyHospital';
import { calculateHaversineDistance } from '../services/nearbyHospitalsService';

export function useUserLocation() {
  const [geoState, setGeoState] = useState<GeolocationState>({
    userLocation: null,
    locationPermission: 'prompt',
    isLocating: false,
    isLiveTracking: false,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<UserLocation | null>(null);

  // Check initial permission status if available in browser
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState(prev => ({
        ...prev,
        locationPermission: 'unsupported',
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then(result => {
          setGeoState(prev => ({
            ...prev,
            locationPermission: result.state as GeolocationState['locationPermission'],
          }));

          result.onchange = () => {
            setGeoState(prev => ({
              ...prev,
              locationPermission: result.state as GeolocationState['locationPermission'],
            }));
          };
        })
        .catch(() => {
          // Ignore permissions query errors on unsupported browsers
        });
    }
  }, []);

  const handleGeolocationError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'An unknown error occurred while retrieving your location.';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location access was denied. Please enable location permission in your browser settings to find nearby hospitals.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable. Please check your GPS or network connection.';
        break;
      case err.TIMEOUT:
        errorMessage = 'Location request timed out. Please try refreshing your location.';
        break;
    }

    setGeoState(prev => ({
      ...prev,
      isLocating: false,
      isLiveTracking: false,
      error: errorMessage,
      errorCode: err.code,
      locationPermission: err.code === err.PERMISSION_DENIED ? 'denied' : prev.locationPermission,
    }));
  }, []);

  // One-time request for user's REAL current location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setGeoState(prev => ({
      ...prev,
      isLocating: true,
      error: null,
    }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      position => {
        const newLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
        };

        lastPositionRef.current = newLocation;

        setGeoState({
          userLocation: newLocation,
          locationPermission: 'granted',
          isLocating: false,
          isLiveTracking: false,
          error: null,
        });
      },
      err => handleGeolocationError(err),
      options
    );
  }, [handleGeolocationError]);

  // Stop watching live position
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGeoState(prev => ({
      ...prev,
      isLiveTracking: false,
    }));
  }, []);

  // Start watching live position with movement threshold check (> 30 meters)
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    // Clear any existing watcher first
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setGeoState(prev => ({
      ...prev,
      isLiveTracking: true,
      error: null,
    }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
    };

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const newLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
        };

        // Only update if moved > 30 meters or first fix to prevent jitter
        const lastLoc = lastPositionRef.current;
        if (lastLoc) {
          const distanceMoved = calculateHaversineDistance(
            lastLoc.latitude,
            lastLoc.longitude,
            newLocation.latitude,
            newLocation.longitude
          );

          if (distanceMoved < 30) {
            // Minor jitter, skip update to save recalculation work
            return;
          }
        }

        lastPositionRef.current = newLocation;

        setGeoState(prev => ({
          ...prev,
          userLocation: newLocation,
          locationPermission: 'granted',
          isLocating: false,
          error: null,
        }));
      },
      err => handleGeolocationError(err),
      options
    );

    watchIdRef.current = watchId;
  }, [handleGeolocationError]);

  // Clean up watcher on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...geoState,
    requestLocation,
    startLiveTracking,
    stopLiveTracking,
  };
}
