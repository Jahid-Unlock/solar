// File: components/cards/SunshineMapCard.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { BuildingInsightsResponse, DataLayersResponse, getDataLayerUrls, LayerId } from '@/types/solar';
import { getLayer } from '@/types/layer';
import type { Layer } from '@/types/layer';

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function SunshineMapCard({
  showPanels,
  googleMapsApiKey,
  buildingInsights,
  geometryLibrary,
  map
}: {
  showPanels: boolean;
  googleMapsApiKey: string;
  buildingInsights: BuildingInsightsResponse | undefined;
  geometryLibrary: google.maps.GeometryLibrary | null;
  map: google.maps.Map | null;
}) {
  const [dataLayersResponse, setDataLayersResponse] = useState<DataLayersResponse | undefined>(undefined);
  const [layerId, setLayerId] = useState('monthlyFlux');
  const [layer, setLayer] = useState<Layer | undefined>(undefined);
  const [imageryQuality, setImageryQuality] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState(6);
  const [hour, setHour] = useState(12);
  const [overlays, setOverlays] = useState<google.maps.GroundOverlay[]>([]);

  // Clear overlays whenever layerId changes
  useEffect(() => {
    overlays.forEach((o) => o.setMap(null));
    setOverlays([]);
  }, [layerId]);

  // Fetch data layer when layerId changes
  useEffect(() => {
    async function fetchLayer() {
      if (layerId === 'none' || !buildingInsights || !geometryLibrary) return;

      const center = buildingInsights.center;
      const ne = buildingInsights.boundingBox.ne;
      const sw = buildingInsights.boundingBox.sw;
      const diameter = geometryLibrary.spherical.computeDistanceBetween(
        new google.maps.LatLng(ne.latitude, ne.longitude),
        new google.maps.LatLng(sw.latitude, sw.longitude)
      );
      const radius = Math.ceil(diameter / 2);

      let response;
      try {
        response = await getDataLayerUrls(center, radius, googleMapsApiKey);
        setDataLayersResponse(response);
        setImageryQuality(response.imageryQuality);
      } catch (err) {
        console.error('Failed to fetch data layers response', err);
        return;
      }

      let layerData;
      try {
        layerData = await getLayer(layerId as LayerId, response, googleMapsApiKey);
        setLayer(layerData);
      } catch (err) {
        console.error('Failed to get layer', err);
        return;
      }
    }

    fetchLayer();
  }, [layerId, buildingInsights, googleMapsApiKey, geometryLibrary]);

  // Render overlays when layer changes or month/hour changes
  useEffect(() => {
    if (!layer) return;

    overlays.forEach((o) => o.setMap(null));

    const bounds = layer.bounds;
    let newOverlays = [];

    if (layer.id === 'monthlyFlux') {
      newOverlays = layer
        .render(true, month, 14)
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

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Sunshine Map</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Map type:</label>
          <select
            value={layerId}
            onChange={(e) => setLayerId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="none">No visualization</option>
            <option value="mask">Roof mask</option>
            <option value="dsm">Digital Surface Model</option>
            <option value="rgb">Aerial image</option>
            <option value="annualFlux">Annual sunshine</option>
            <option value="monthlyFlux">Monthly sunshine</option>
            <option value="hourlyShade">Hourly shade</option>
          </select>
        </div>
        
        {imageryQuality && (
          <div className="text-sm text-gray-600">
            Imagery quality: {imageryQuality}
          </div>
        )}
        
        {layerId === 'monthlyFlux' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Month: {monthNames[month]}
            </label>
            <input
              type="range"
              min={0}
              max={11}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
        
        {layerId === 'hourlyShade' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Hour: {hour}:00
            </label>
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}