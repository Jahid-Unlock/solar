import { useState, useEffect } from 'react';
import { findClosestBuilding, BuildingInsightsResponse } from '@/types/solar';
import { findSolarConfig } from '@/types/utils';

export const useSolarData = (
  location: google.maps.LatLng | null,
  googleMapsApiKey: string,
  monthlyAverageEnergyBill: number,
  energyCostPerKwh: number,
  panelCapacityWatts: number,
  dcToAcDerate: number
) => {
  const [buildingInsights, setBuildingInsights] = useState<BuildingInsightsResponse | undefined>();
  const [configId, setConfigId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const yearlyKwhEnergyConsumption = (monthlyAverageEnergyBill / energyCostPerKwh) * 12;

  useEffect(() => {
    const fetchData = async () => {
      if (!location) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await findClosestBuilding(location, googleMapsApiKey);
        setBuildingInsights(response);
        
        // Calculate initial config ID
        const defaultPanelCapacity = response.solarPotential.panelCapacityWatts;
        const panelCapacityRatio = panelCapacityWatts / defaultPanelCapacity;
        const foundConfigId = findSolarConfig(
          response.solarPotential.solarPanelConfigs,
          yearlyKwhEnergyConsumption,
          panelCapacityRatio,
          dcToAcDerate
        );
        setConfigId(foundConfigId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch solar data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location, googleMapsApiKey, yearlyKwhEnergyConsumption, panelCapacityWatts, dcToAcDerate]);

  return {
    buildingInsights,
    configId,
    setConfigId,
    loading,
    error,
    setBuildingInsights
  };
};