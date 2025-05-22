import { useEffect, useState } from 'react';
import { createPalette, normalize, rgbToColor } from '@/types/visualize';
import { panelsPalette } from '@/types/colors';
import { showNumber } from '@/types/utils';
import type { BuildingInsightsResponse } from '@/types/solar';

export default function BuildingInsightsCard({
  buildingInsights,
  configId,
  showPanels,
  setShowPanels,
  panelCapacityWatts,
  googleMapsApiKey,
  geometryLibrary,
  location,
  map
}: {
  buildingInsights: BuildingInsightsResponse;
  configId: number;
  showPanels: boolean;
  setShowPanels: (showPanels: boolean) => void;
  panelCapacityWatts: number;
  googleMapsApiKey: string;
  geometryLibrary: google.maps.GeometryLibrary | null;
  location: google.maps.LatLng | null;
  map: google.maps.Map | null;
}) {
  const [solarPanels, setSolarPanels] = useState<google.maps.Polygon[]>([]);

  const panelConfig = buildingInsights.solarPotential.solarPanelConfigs[configId];

  useEffect(() => {
    if (!geometryLibrary || !map) return;

    const solarPotential = buildingInsights.solarPotential;
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

    return () => {
      solarPanels.forEach(panel => panel.setMap(null));
    };
  }, [buildingInsights, geometryLibrary, map]);

  useEffect(() => {
    solarPanels.forEach((panel, i) =>
      panel.setMap(showPanels && panelConfig && i < panelConfig.panelsCount ? map : null)
    );
  }, [solarPanels, showPanels, panelConfig, map]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Building Analysis</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Annual sunshine</div>
          <div>{showNumber(buildingInsights.solarPotential.maxSunshineHoursPerYear)} hours</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Roof area</div>
          <div>{showNumber(buildingInsights.solarPotential.wholeRoofStats.areaMeters2)} m²</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Max panel count</div>
          <div>{showNumber(buildingInsights.solarPotential.solarPanels.length)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">CO₂ savings</div>
          <div>{showNumber(buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh)} kg/MWh</div>
        </div>
      </div>
    </div>
  );
}