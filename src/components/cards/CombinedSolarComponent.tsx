'use client';

import { useEffect, useState } from 'react';
import { findClosestBuilding } from '@/types/solar';
import { createPalette, normalize, rgbToColor } from '@/types/visualize';
import { panelsPalette } from '@/types/colors';
import { getDataLayerUrls } from '@/types/solar';
import { getLayer } from '@/types/layer';
import type { 
  BuildingInsightsResponse, 
  SolarPanelConfig, 
  DataLayersResponse, 
  LayerId 
} from '@/types/solar';
import type { Layer } from '@/types/layer';
import { Slider } from '../ui/slider';

type Props = {
  buildingInsights: BuildingInsightsResponse | undefined;
  setBuildingInsights: (data: BuildingInsightsResponse | undefined) => void;
  configId: number | undefined;
  setConfigId: (id: number | undefined) => void;
  panelCapacityWatts: number;
  googleMapsApiKey: string;
  geometryLibrary: google.maps.GeometryLibrary;
  location: google.maps.LatLng;
  map: google.maps.Map;
};

export default function CombinedSolarComponent({
  buildingInsights,
  setBuildingInsights,
  configId,
  setConfigId,
  panelCapacityWatts,
  googleMapsApiKey,
  geometryLibrary,
  location,
  map
}: Props) {
  // Solar Panels State
  const [solarPanels, setSolarPanels] = useState<google.maps.Polygon[]>([]);
  const [showPanels, setShowPanels] = useState(true);
  const [requestError, setRequestError] = useState<any>(undefined);

  // Data Layers State
  const [dataLayersResponse, setDataLayersResponse] = useState<DataLayersResponse | undefined>();
  const [layerId, setLayerId] = useState<LayerId | 'none'>('monthlyFlux');
  const [layer, setLayer] = useState<Layer | undefined>();
  const [imageryQuality, setImageryQuality] = useState<'HIGH' | 'MEDIUM' | 'LOW' | undefined>();
  const [month, setMonth] = useState(6); // Default to July
  const [hour, setHour] = useState(14); // Default to 2 PM
  const [overlays, setOverlays] = useState<google.maps.GroundOverlay[]>([]);

  const panelCapacityRatio = buildingInsights
    ? panelCapacityWatts / buildingInsights.solarPotential.panelCapacityWatts
    : 1.0;

  const panelConfig: SolarPanelConfig | undefined = buildingInsights && configId !== undefined
    ? buildingInsights.solarPotential.solarPanelConfigs[configId]
    : undefined;

  // Function to load solar panel data
  const showSolarPotential = async () => {
    setRequestError(undefined);
    setBuildingInsights(undefined);
    solarPanels.forEach((panel) => panel.setMap(null));
    setSolarPanels([]);

    try {
      const response = await findClosestBuilding(location, googleMapsApiKey);
      setBuildingInsights(response);
      
      const solarPotential = response.solarPotential;
      const palette = createPalette(panelsPalette).map(rgbToColor);
      const minEnergy = solarPotential.solarPanels.slice(-1)[0].yearlyEnergyDcKwh;
      const maxEnergy = solarPotential.solarPanels[0].yearlyEnergyDcKwh;
      
      const newPanels = solarPotential.solarPanels.map((panel) => {
        const [w, h] = [
          solarPotential.panelWidthMeters / 2,
          solarPotential.panelHeightMeters / 2
        ];
        const points = [
          { x: w, y: h },
          { x: w, y: -h },
          { x: -w, y: -h },
          { x: -w, y: h },
          { x: w, y: h }
        ];
        const orientation = panel.orientation === 'PORTRAIT' ? 90 : 0;
        const azimuth = solarPotential.roofSegmentStats[panel.segmentIndex].azimuthDegrees;
        const colorIndex = Math.round(
          normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255
        );

        return new google.maps.Polygon({
          paths: points.map(({ x, y }) =>
            geometryLibrary.spherical.computeOffset(
              { lat: panel.center.latitude, lng: panel.center.longitude },
              Math.sqrt(x * x + y * y),
              Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth
            )
          ),
          strokeColor: '#B0BEC5',
          strokeOpacity: 0.9,
          strokeWeight: 1,
          fillColor: palette[colorIndex],
          fillOpacity: 0.9
        });
      });

      setSolarPanels(newPanels);
    } catch (error) {
      setRequestError(error);
      console.error('Error fetching building insights:', error);
    }
  };

  // Function to fetch and initialize data layers
  const initializeDataLayers = async () => {
    if (!buildingInsights || layerId === 'none') return;

    try {
      const center = buildingInsights.center;
      const ne = buildingInsights.boundingBox.ne;
      const sw = buildingInsights.boundingBox.sw;
      const diameter = geometryLibrary.spherical.computeDistanceBetween(
        new google.maps.LatLng(ne.latitude, ne.longitude),
        new google.maps.LatLng(sw.latitude, sw.longitude)
      );
      const radius = Math.ceil(diameter / 2);

      const response = await getDataLayerUrls(center, radius, googleMapsApiKey);
      setDataLayersResponse(response);
      setImageryQuality(response.imageryQuality);

      const layerData = await getLayer(layerId, response, googleMapsApiKey);
      setLayer(layerData);
    } catch (err) {
      console.error('Failed to initialize data layers:', err);
    }
  };

  // Load solar potential data when location changes
  useEffect(() => {
    showSolarPotential();
  }, [location]);

  // Update panel visibility when configId or showPanels changes
  useEffect(() => {
    if (solarPanels.length > 0 && panelConfig) {
      solarPanels.forEach((panel, i) =>
        panel.setMap(showPanels && i < panelConfig.panelsCount ? map : null)
      );
    }
  }, [solarPanels, showPanels, panelConfig, map]);

  // Clear overlays when layerId changes
  useEffect(() => {
    overlays.forEach((o) => o.setMap(null));
    setOverlays([]);
  }, [layerId]);

  // Fetch data layer when buildingInsights or layerId changes
  useEffect(() => {
    if (buildingInsights) {
      initializeDataLayers();
    }
  }, [buildingInsights, layerId]);

  // Render layer overlays when layer data or month/hour changes
  useEffect(() => {
    if (!layer) return;

    overlays.forEach((o) => o.setMap(null));

    const bounds = layer.bounds;
    let newOverlays: google.maps.GroundOverlay[] = [];

    if (layer.id === 'monthlyFlux') {
      newOverlays = layer
        .render(true, month, hour)
        .map((canvas) => new google.maps.GroundOverlay(canvas.toDataURL(), bounds));
    } else if (layer.id === 'hourlyShade') {
      newOverlays = layer
        .render(true, month, hour)
        .map((canvas) => new google.maps.GroundOverlay(canvas.toDataURL(), bounds));
    } else {
      newOverlays = layer
        .render(true, month, hour)
        .map((canvas) => new google.maps.GroundOverlay(canvas.toDataURL(), bounds));
    }

    newOverlays.forEach((overlay, index) => {
      if (layer.id === 'monthlyFlux') {
        if (index === month) overlay.setMap(map);
      } else if (layer.id === 'hourlyShade') {
        if (index === hour) overlay.setMap(map);
      } else {
        overlay.setMap(map);
      }
    });

    setOverlays(newOverlays);
  }, [layer, month, hour, map]);

  // Only render the SolarPanelCountSlider
  if (requestError) {
    return null;
  }

  if (!buildingInsights) {
    return null;
  }

  return (
      <>
        {buildingInsights && configId !== undefined && (
        <div className="p-4 bg-white rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="flex flex-col space-y-2">
              <span className="text-sm font-medium">Panel Count: {Math.min(100, panelConfig?.panelsCount || 0)}</span>
              {/* <input
                type="range"
                min={0}
                max={Math.min(100, buildingInsights.solarPotential.solarPanelConfigs.length - 1)}
                value={configId}
                onChange={(e) => setConfigId(Number(e.target.value))}
                className="w-full"
              /> */}
               <Slider
                defaultValue={[configId || 0]}
                max={Math.min(100, buildingInsights.solarPotential.solarPanelConfigs.length - 1)}
                step={1}
                onValueChange={(value) => setConfigId(value[0])}
              />
            </label>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
         </div>
      )}
      </>
   
  );
}