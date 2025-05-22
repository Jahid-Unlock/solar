'use client';

import { useState, useEffect } from 'react';
import { findSolarConfig } from '@/types/utils';
import { BuildingInsightsResponse } from '@/types/solar';
import BuildingInsightsSection from '@/components/BuildingInsightsSection';
import DataLayersSection from '@/components/DataLayersSection';
import SolarPotentialSection from '@/components/SolarPotentialSection';
import { useMapContext } from '@/context/MapContext';

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function DashboardPage() {
  const {
    location,
    map,
    geometryLibrary,
  } = useMapContext();

  const [buildingInsights, setBuildingInsights] = useState<BuildingInsightsResponse | undefined>();
  const [configId, setConfigId] = useState<number | undefined>();
  const [showPanels, setShowPanels] = useState(true);

  const [monthlyAverageEnergyBillInput, setMonthlyAverageEnergyBillInput] = useState(300);
  const [panelCapacityWattsInput, setPanelCapacityWattsInput] = useState(425);
  const [energyCostPerKwhInput, setEnergyCostPerKwhInput] = useState(0.36);
  const [dcToAcDerateInput, setDcToAcDerateInput] = useState(0.90);

  const yearlyKwhEnergyConsumption = (monthlyAverageEnergyBillInput / energyCostPerKwhInput) * 12;

  useEffect(() => {
    if (buildingInsights && configId === undefined) {
      const defaultPanelCapacity = buildingInsights.solarPotential.panelCapacityWatts;
      const panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacity;
      const foundConfigId = findSolarConfig(
        buildingInsights.solarPotential.solarPanelConfigs,
        yearlyKwhEnergyConsumption,
        panelCapacityRatio,
        dcToAcDerateInput
      );
      setConfigId(foundConfigId);
    }
  }, [buildingInsights, configId, yearlyKwhEnergyConsumption, panelCapacityWattsInput, dcToAcDerateInput]);

  return (
    <div className="flex flex-col space-y-4">
      {geometryLibrary && map && (
        <BuildingInsightsSection
          buildingInsights={buildingInsights}
          setBuildingInsights={setBuildingInsights}
          configId={configId}
          setConfigId={setConfigId}
          showPanels={showPanels}
          setShowPanels={setShowPanels}
          panelCapacityWatts={panelCapacityWattsInput}
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          geometryLibrary={geometryLibrary!}
          location={location!}
          map={map!}
        />
      )}

      {buildingInsights && configId !== undefined && (
        <>
          <DataLayersSection
            showPanels={showPanels}
            buildingInsights={buildingInsights}
            geometryLibrary={geometryLibrary!}
            map={map!}
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          />

          <SolarPotentialSection
            initialConfigId={configId}
            initialMonthlyAverageEnergyBill={monthlyAverageEnergyBillInput}
            initialEnergyCostPerKwh={energyCostPerKwhInput}
            initialPanelCapacityWatts={panelCapacityWattsInput}
            initialDcToAcDerate={dcToAcDerateInput}
            solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
            defaultPanelCapacityWatts={buildingInsights.solarPotential.panelCapacityWatts}
            configId={configId}
            setConfigId={setConfigId}
          />
        </>
      )}
    </div>
  );
}
