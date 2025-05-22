'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

export default function SearchBar({
  location,
  setLocation,
  placesLibrary,
  map,
  initialValue = '',
  zoom = 19,
}: {
  location: google.maps.LatLng | undefined | null;
  setLocation: (loc: google.maps.LatLng) => void;
  placesLibrary: google.maps.PlacesLibrary;
  map: google.maps.Map;
  initialValue?: string;
  zoom?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(initialValue);


  useEffect(() => {
    if (!inputRef.current) return;

    const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        setSearchTerm('');
        return;
      }

      map.setCenter(place.geometry.location);
      map.setZoom(zoom);

      setLocation(place.geometry.location);
      setSearchTerm(place.name || place.formatted_address || '');
    });
  }, [placesLibrary, map, zoom]);

  return (
    <div className="w-full relative">
      <Input
        className="w-full lg:h-12 h-10 border-primary/50 border-[1.5px] lg:text-lg text-base"
        autoFocus={true}
        type="text"
        ref={inputRef}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search an address"
      />
      <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-primary/50" />
    </div>
  );
}
