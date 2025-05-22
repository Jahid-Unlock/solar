'use client';

import { useEffect, useState } from 'react';
import { findClosestBuilding } from '@/types/solar';
import { createPalette, normalize, rgbToColor } from '@/types/visualize';
import { panelsPalette } from '@/types/colors';
import { showNumber } from '@/types/utils';
import type { BuildingInsightsResponse, SolarPanelConfig } from '@/types/solar';

type Props = {
  buildingInsights: BuildingInsightsResponse | undefined;
  setBuildingInsights: (data: BuildingInsightsResponse | undefined) => void;
  configId: number | undefined;
  setConfigId: (id: number | undefined) => void;
  showPanels: boolean;
  setShowPanels: (val: boolean) => void;
  panelCapacityWatts: number;
  googleMapsApiKey: string;
  geometryLibrary: google.maps.GeometryLibrary;
  location: google.maps.LatLng;
  map: google.maps.Map;
};

export default function BuildingInsightsSection({
  buildingInsights,
  setBuildingInsights,
  configId,
  setConfigId,
  showPanels,
  setShowPanels,
  panelCapacityWatts,
  googleMapsApiKey,
  geometryLibrary,
  location,
  map
}: Props) {
  const [solarPanels, setSolarPanels] = useState<google.maps.Polygon[]>([]);
  const [requestError, setRequestError] = useState<any>(undefined);

  const panelCapacityRatio =
    buildingInsights
      ? panelCapacityWatts / buildingInsights.solarPotential.panelCapacityWatts
      : 1.0;

  const panelConfig: SolarPanelConfig | undefined = buildingInsights && configId !== undefined ? buildingInsights.solarPotential.solarPanelConfigs[configId]
      : undefined;

  const showSolarPotential = async () => {
    setRequestError(undefined);
    setBuildingInsights(undefined);
    solarPanels.forEach((panel) => panel.setMap(null));
    setSolarPanels([]);

    try {
      const response = await findClosestBuilding(location, googleMapsApiKey);
      setBuildingInsights(response);
      // console.log(response);
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
    }
  };

  useEffect(() => {
    showSolarPotential();
  }, [location]);

  useEffect(() => {
    // console.log("solarPanels", solarPanels)
    console.log("Total panels available:", buildingInsights?.solarPotential.solarPanels.length);
    console.log("Panels being shown:", panelConfig?.panelsCount);
    solarPanels.forEach((panel, i) =>
      panel.setMap(showPanels && panelConfig && i < panelConfig.panelsCount ? map : null)
    );
  }, [solarPanels, showPanels, panelConfig]);

  if (requestError) {
    return (
      <div>
        <p>Error: {requestError.message}</p>
        <button onClick={showSolarPotential}>Retry</button>
      </div>
    );
  }

  if (!buildingInsights) {
    return <p>Loading building insights...</p>;
  }

  return (
    <div className="space-y-2">
      <h2>Building Insights</h2>
      {panelConfig && (
        <div>
          {/*
            <p>
            Yearly energy: {((panelConfig.yearlyEnergyDcKwh * panelCapacityRatio) / 1000).toFixed(2)} MWh
          </p>
          */}
          <p>Annual sunshine: {showNumber(buildingInsights.solarPotential.maxSunshineHoursPerYear)} hr</p>
          <p>Roof area: {showNumber(buildingInsights.solarPotential.wholeRoofStats.areaMeters2)} m²</p>
          <p>Max panel count: {showNumber(buildingInsights.solarPotential.solarPanels.length)}</p>
          <p>CO₂ savings: {showNumber(buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh)} Kg/MWh</p>
        </div>
      )}

      <div>
        {/* <label>
          <input
            type="checkbox"
            checked={showPanels}
            onChange={(e) => setShowPanels(e.target.checked)}
          />{' '}
          Show Solar Panels
        </label> */}
      </div>
    </div>
  );
}
