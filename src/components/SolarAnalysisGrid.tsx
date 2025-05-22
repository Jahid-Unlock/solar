import { useState } from 'react';
import BuildingInsightsCard from '@/components/cards/BuildingInsightsCard';
import SolarVisualizationCard from './cards/SolarVisualizationCard';
import SunshineMapCard from './cards/SunshineMapCard';
import SolarFinancialCalculatorCard from './cards/SolarFinancialCalculatorCard';
import SolarFinancialChartCard from './cards/SolarFinancialChartCard';
import type { BuildingInsightsResponse } from '@/types/solar';

export default function SolarAnalysisGrid({
  buildingInsights,
  configId,
  setConfigId,
  showPanels,
  setShowPanels,
  location,
  map,
  geometryLibrary,
  googleMapsApiKey,
  monthlyAverageEnergyBillInput,
  panelCapacityWattsInput,
  energyCostPerKwhInput,
  dcToAcDerate
}: {
  buildingInsights: BuildingInsightsResponse | undefined;
  configId: number | undefined;
  setConfigId: (configId: number | undefined) => void;
  showPanels: boolean;
  setShowPanels: (showPanels: boolean) => void;
  location: google.maps.LatLng | null;
  map: google.maps.Map | null;
  geometryLibrary: google.maps.GeometryLibrary | null;
  googleMapsApiKey: string;
  monthlyAverageEnergyBillInput: number;
  panelCapacityWattsInput: number;
  energyCostPerKwhInput: number;
  dcToAcDerate: number;
}) {
  const [calculatorInputs, setCalculatorInputs] = useState({
    monthlyAverageEnergyBill: monthlyAverageEnergyBillInput,
    energyCostPerKwh: energyCostPerKwhInput,
    panelCapacityWatts: panelCapacityWattsInput,
    dcToAcDerate: dcToAcDerate,
  });
  
  const [sharedValues, setSharedValues] = useState<any>(null);

  if (!buildingInsights || configId === undefined) {
    return null;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <BuildingInsightsCard
          buildingInsights={buildingInsights}
          configId={configId}
          showPanels={showPanels}
          setShowPanels={setShowPanels}
          panelCapacityWatts={panelCapacityWattsInput}
          googleMapsApiKey={googleMapsApiKey}
          geometryLibrary={geometryLibrary}
          location={location}
          map={map}
        />

        {sharedValues && <SolarFinancialChartCard sharedValues={sharedValues} />}
      </div>
      
      <div className="space-y-4">
        <SolarFinancialCalculatorCard
          configId={configId}
          setConfigId={setConfigId}
          solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
          defaultPanelCapacityWatts={buildingInsights.solarPotential.panelCapacityWatts}
          setSharedValues={setSharedValues}
          calculatorInputs={calculatorInputs}
          setCalculatorInputs={setCalculatorInputs}
        />
      </div>
    </div>
  );
}