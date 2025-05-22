'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type MapContextType = {
  location: google.maps.LatLng | null;
  setLocation: (loc: google.maps.LatLng | null) => void;
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map | null) => void;
  geometryLibrary: google.maps.GeometryLibrary | null;
  setGeometryLibrary: (lib: google.maps.GeometryLibrary | null) => void;
  mapsLibrary: google.maps.MapsLibrary | null;
  setMapsLibrary: (lib: google.maps.MapsLibrary | null) => void;
  placesLibrary: google.maps.PlacesLibrary | null;
  setPlacesLibrary: (lib: google.maps.PlacesLibrary | null) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMapContext must be used within MapProvider');
  return context;
};

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<google.maps.LatLng | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geometryLibrary, setGeometryLibrary] = useState<google.maps.GeometryLibrary | null>(null);
  const [mapsLibrary, setMapsLibrary] = useState<google.maps.MapsLibrary | null>(null);
  const [placesLibrary, setPlacesLibrary] = useState<google.maps.PlacesLibrary | null>(null);

  return (
    <MapContext.Provider value={{
      location, setLocation,
      map, setMap,
      geometryLibrary, setGeometryLibrary,
      mapsLibrary, setMapsLibrary,
      placesLibrary, setPlacesLibrary
    }}>
      {children}
    </MapContext.Provider>
  );
};
