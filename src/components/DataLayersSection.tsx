'use client';

import { useState, useEffect, useRef } from 'react';
import { getDataLayerUrls, BuildingInsightsResponse, DataLayersResponse, LayerId } from '@/types/solar';
import { getLayer } from '@/types/layer';
import type { Layer } from '@/types/layer';


const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

type Props = {
  // showPanels: boolean;
  googleMapsApiKey: string;
  buildingInsights: BuildingInsightsResponse;
  geometryLibrary: google.maps.GeometryLibrary;
  map: google.maps.Map;
};

export default function DataLayersSection({
  // showPanels,
  googleMapsApiKey,
  buildingInsights,
  geometryLibrary,
  map
}: Props) {
  const [dataLayersResponse, setDataLayersResponse] = useState<DataLayersResponse | undefined>();
  const [layerId, setLayerId] = useState<LayerId | 'none'>('monthlyFlux');
  const [layer, setLayer] = useState<Layer | undefined>();
  const [imageryQuality, setImageryQuality] = useState<'HIGH' | 'MEDIUM' | 'LOW' | undefined>();
  const [month, setMonth] = useState(6);
  const [hour, setHour] = useState(0);
  const [overlays, setOverlays] = useState<google.maps.GroundOverlay[]>([]);
  const [hideInfo, setHideInfo] = useState(false);

  // Clear overlays whenever layerId changes
  useEffect(() => {
    overlays.forEach((o) => o.setMap(null));
    setOverlays([]);
  }, [layerId]);

  // Fetch data layer when layerId changes
  useEffect(() => {
    async function fetchLayer() {
      if (layerId === 'none') return;

      const center = buildingInsights.center;
      const ne = buildingInsights.boundingBox.ne;
      const sw = buildingInsights.boundingBox.sw;
      const diameter = geometryLibrary.spherical.computeDistanceBetween(
        new google.maps.LatLng(ne.latitude, ne.longitude),
        new google.maps.LatLng(sw.latitude, sw.longitude)
      );
      const radius = Math.ceil(diameter / 2);

      let response: DataLayersResponse;
      try {
        response = await getDataLayerUrls(center, radius, googleMapsApiKey);
        setDataLayersResponse(response);
        setImageryQuality(response.imageryQuality);
      } catch (err) {
        console.error('Failed to fetch data layers response', err);
        return;
      }

      let layerData: Layer;
      try {
        layerData = await getLayer(layerId, response, googleMapsApiKey);
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
    let newOverlays: google.maps.GroundOverlay[] = [];

    if (layer.id === 'monthlyFlux') {
      newOverlays = layer
        .render(true, month, 14)
        .map((canvas) => new google.maps.GroundOverlay(canvas.toDataURL(), bounds));
    } else if (layer.id === 'hourlyShade') {
      newOverlays = layer
        .render(true, month, 14)
        .map((canvas) => new google.maps.GroundOverlay(canvas.toDataURL(), bounds));
    } else {
      newOverlays = layer
        .render(true, month, 14)
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
    
    <>
      {hideInfo ? (
        <div className="py-4 border-t border-b border-gray-200">
        <h2>Data Layers</h2>
  
        <label>
          Select Layer:
          <select
            value={layerId}
            onChange={(e) => {
              setLayerId(e.target.value as LayerId | 'none');
              setLayer(undefined); // Reset layer when changing selection
            }}
          >
            <option value="none">No layer</option>
            <option value="mask">Roof mask</option>
            <option value="dsm">Digital Surface Model</option>
            <option value="rgb">Aerial image</option>
            <option value="annualFlux">Annual sunshine</option>
            <option value="monthlyFlux">Monthly sunshine</option>
            <option value="hourlyShade">Hourly shade</option>
          </select>
        </label>
  
        {imageryQuality && (
          <p>Imagery quality: {imageryQuality}</p>
        )}
  
        {/* {layerId === 'monthlyFlux' && (
          <div>
            <label>
              Month:
              <input
                type="range"
                min={0}
                max={11}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            </label>
            <span>{monthNames[month]}</span>
          </div>
        )} */}
  
        {/* {layerId === 'hourlyShade' && (
          <div>
            <label>
              Hour:
              <input
                type="range"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
              />
            </label>
            <span>{hour}:00</span>
          </div>
        )} */}
  
        {/* {layer && (
          <div>
            <p>Layer {layerId} loaded successfully.</p>
          </div>
        )} */}
      </div>
      ) : null}
    </>
  );
}
