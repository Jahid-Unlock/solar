'use client';

import { useEffect } from 'react';
import { showMoney, showNumber } from '@/types/utils';
import type { SolarPanelConfig } from '@/types/solar';
import SolarPanelSlider from './SolarPanelSlider';
import SolarPanelCountSlider from './SolarPanelCountSlider';
import MonthlyEnergyBillInput from './MonthlyEnergyBillInput';

export default function SolarFinancialCalculatorCard({
  calculatorInputs,
  setCalculatorInputs,
  configId,
  setConfigId,
  solarPanelConfigs,
  defaultPanelCapacityWatts,
  setSharedValues
}: {
  configId: number;
  setConfigId: (id: number) => void;
  solarPanelConfigs: SolarPanelConfig[];
  defaultPanelCapacityWatts?: number;
  setSharedValues: (values: any) => void;
  calculatorInputs: {
    monthlyAverageEnergyBill: number;
    energyCostPerKwh: number;
    panelCapacityWatts: number;
    dcToAcDerate: number;
  };
  setCalculatorInputs: (inputs: any) => void;
}) {
  const { monthlyAverageEnergyBill, energyCostPerKwh, panelCapacityWatts, dcToAcDerate } = calculatorInputs;

  const panelCapacityRatio = panelCapacityWatts / (defaultPanelCapacityWatts || 425);
  const panelsCount = solarPanelConfigs[configId]?.panelsCount || 0;
  const yearlyEnergyDcKwh = solarPanelConfigs[configId]?.yearlyEnergyDcKwh || 0;
  const installationSizeKw = (panelsCount * panelCapacityWatts) / 1000;
  const installationCostPerWatt = 3.0;
  const installationCostTotal = installationCostPerWatt * installationSizeKw * 1000;
  const solarIncentives = installationCostTotal * 0.3;
  const monthlyKwhEnergyConsumption = monthlyAverageEnergyBill / energyCostPerKwh;
  const yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
  const initialAcKwhPerYear = yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerate;
  const energyCovered = initialAcKwhPerYear / yearlyKwhEnergyConsumption;

  useEffect(() => {
    setSharedValues({
      installationCostTotal,
      solarIncentives,
      yearlyKwhEnergyConsumption,
      energyCostPerKwh,
      monthlyAverageEnergyBill,
      installationLifeSpan: 25,
      costIncreaseFactor: 1.06,
      discountRate: 1.00,
      initialAcKwhPerYear
    });
  }, [
    installationCostTotal,
    solarIncentives,
    yearlyKwhEnergyConsumption,
    energyCostPerKwh,
    monthlyAverageEnergyBill,
    initialAcKwhPerYear,
    setSharedValues
  ]);

  return (
    <div className="space-y-4">
      <MonthlyEnergyBillInput
        monthlyAverageEnergyBill={monthlyAverageEnergyBill}
        setCalculatorInputs={setCalculatorInputs}
        calculatorInputs={calculatorInputs}
      />

      <SolarPanelCountSlider
        panelsCount={panelsCount}
        solarPanelConfigs={solarPanelConfigs}
        configId={configId}
        setConfigId={setConfigId}
      />

      <div className="p-4 bg-white rounded shadow border mt-4">
        <h3 className="text-lg font-semibold mb-4">Solar Potential Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
          <div>
            <div className="text-gray-500">Yearly energy</div>
            <div>{showNumber(yearlyEnergyDcKwh * panelCapacityRatio)} kWh</div>
          </div>
          <div>
            <div className="text-gray-500">Installation size</div>
            <div>{showNumber(installationSizeKw)} kW</div>
          </div>
          <div>
            <div className="text-gray-500">Installation cost</div>
            <div>{showMoney(installationCostTotal)}</div>
          </div>
          <div>
            <div className="text-gray-500">Incentives</div>
            <div>{showMoney(solarIncentives)}</div>
          </div>
          <div>
            <div className="text-gray-500">Energy covered</div>
            <div>{Math.round(energyCovered * 100)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Panel capacity</div>
            <div>{showNumber(panelCapacityWatts)} W</div>
          </div>
          <div>
            <div className="text-gray-500">Energy cost per kWh</div>
            <div>{showMoney(energyCostPerKwh)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}