'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import SearchBar from '@/components/SearchBar';
import SolarModal from '@/components/SolarModal';
import SolarPanelCountSlider from '@/components/cards/SolarPanelCountSlider';
import { useSolarData } from '@/hooks/useSolarData';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import MonthlyEnergyBillInput from '@/components/cards/MonthlyEnergyBillInput';
import BuildingInsightsCard from '@/components/cards/BuildingInsightsCard';
import SunshineMapCard from '@/components/cards/SunshineMapCard';

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

const defaultPlace = {
  name: "The Los Angeles Country Club",
  address: "10101 Wilshire Blvd, Los Angeles, CA 90024",
};

export default function MapPage() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [location, setLocation] = useState<google.maps.LatLng | null>(null);
  const [geometryLibrary, setGeometryLibrary] = useState<google.maps.GeometryLibrary | null>(null);
  const [mapsLibrary, setMapsLibrary] = useState<google.maps.MapsLibrary | null>(null);
  const [placesLibrary, setPlacesLibrary] = useState<google.maps.PlacesLibrary | null>(null);

  const [open, setOpen] = useState(false);
  const [showPanels, setShowPanels] = useState(true);
  const [calculatorInputs, setCalculatorInputs] = useState({
    monthlyAverageEnergyBill: 300,
    energyCostPerKwh: 0.36,
    panelCapacityWatts: 425,
    dcToAcDerate: 0.9,
  });

  const {
    buildingInsights,
    setBuildingInsights,
    configId,
    setConfigId,
    loading,
    error
  } = useSolarData(
    location,
    googleMapsApiKey,
    calculatorInputs.monthlyAverageEnergyBill,
    calculatorInputs.energyCostPerKwh,
    calculatorInputs.panelCapacityWatts,
    calculatorInputs.dcToAcDerate
  );

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({ apiKey: googleMapsApiKey, version: 'weekly' });

      const [geometry, maps, places] = await Promise.all([
        loader.importLibrary('geometry') as Promise<google.maps.GeometryLibrary>,
        loader.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
        loader.importLibrary('places') as Promise<google.maps.PlacesLibrary>,
      ]);

      setGeometryLibrary(geometry);
      setMapsLibrary(maps);
      setPlacesLibrary(places);

      const geocoder = new google.maps.Geocoder();
      const geocoderResponse = await geocoder.geocode({ address: defaultPlace.address });

      if (geocoderResponse.results.length > 0) {
        const geocoderResult = geocoderResponse.results[0];
        const loc = geocoderResult.geometry.location;
        setLocation(loc);

        if (mapElementRef.current) {
          const mapInstance = new maps.Map(mapElementRef.current, {
            center: loc,
            zoom: 19,
            tilt: 0,
            mapTypeId: 'satellite',
            mapTypeControl: false,
            fullscreenControl: false,
            rotateControl: false,
            streetViewControl: false,
            zoomControl: false,
          });
          setMap(mapInstance);
        }
      }
    };

    initMap();
  }, []);

  return (
    <div className="flex flex-row">
      <aside className="flex-none md:w-96 w-80 p-4 pt-3 overflow-auto">
        <div className="flex flex-col space-y-4 h-full min-h-[500px]">
          {placesLibrary && map && (
            <SearchBar 
              location={location} 
              setLocation={setLocation} 
              placesLibrary={placesLibrary} 
              map={map} 
              initialValue={defaultPlace.name} 
            />
          )}

          {buildingInsights && configId !== undefined && (
            <>
              <MonthlyEnergyBillInput
                monthlyAverageEnergyBill={calculatorInputs.monthlyAverageEnergyBill}
                setCalculatorInputs={setCalculatorInputs}
                calculatorInputs={calculatorInputs}
              />

              <SolarPanelCountSlider
                panelsCount={buildingInsights.solarPotential.solarPanelConfigs[configId].panelsCount}
                solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
                configId={configId}
                setConfigId={setConfigId}
              />
            </>
          )}

          {buildingInsights && buildingInsights.solarPotential.solarPanelConfigs.length > 0 ? (
            <Button 
              onClick={() => setOpen(true)}
              size="lg"
            >
              View Full Analysis
            </Button>
          ) : <Button className="w-full" size="lg">Data Loading... <Loader2 className="w-4 h-4 animate-spin" /></Button>}

          {buildingInsights && geometryLibrary && map && (
            <>
              <BuildingInsightsCard
                buildingInsights={buildingInsights}
                configId={configId!}
                showPanels={showPanels}
                setShowPanels={setShowPanels}
                panelCapacityWatts={calculatorInputs.panelCapacityWatts}
                googleMapsApiKey={googleMapsApiKey}
                geometryLibrary={geometryLibrary}
                location={location}
                map={map}
              />

              <SunshineMapCard
                showPanels={showPanels}
                buildingInsights={buildingInsights}
                geometryLibrary={geometryLibrary}
                map={map}
                googleMapsApiKey={googleMapsApiKey}
              />
            </>
          )}

          <SolarModal
            open={open}
            setOpen={setOpen}
            location={location}
            map={map}
            geometryLibrary={geometryLibrary}
            googleMapsApiKey={googleMapsApiKey}
            monthlyAverageEnergyBillInput={calculatorInputs.monthlyAverageEnergyBill}
            panelCapacityWattsInput={calculatorInputs.panelCapacityWatts}
            energyCostPerKwhInput={calculatorInputs.energyCostPerKwh}
            configId={configId}
            setConfigId={setConfigId}
            calculatorInputs={calculatorInputs}
            setCalculatorInputs={setCalculatorInputs}
          />

          <div className="grow" />
        </div>
      </aside>

      <div ref={mapElementRef} className="min-h-screen w-full" />
    </div>
  );
}