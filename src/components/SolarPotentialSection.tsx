'use client';

import { useState, useEffect, useRef } from 'react';
import { findSolarConfig, showMoney, showNumber } from '@/types/utils';
import type { SolarPanelConfig } from '@/types/solar';

const SolarPotentialAnalysis = ({
  initialConfigId = 0,
  initialMonthlyAverageEnergyBill = 300,
  initialEnergyCostPerKwh = 0.36,
  initialPanelCapacityWatts = 250,
  initialDcToAcDerate = 0.90,
  solarPanelConfigs = [] as SolarPanelConfig[],
  defaultPanelCapacityWatts = 425,
  configId,
  setConfigId,
}: {
  initialConfigId?: number;
  initialMonthlyAverageEnergyBill?: number;
  initialEnergyCostPerKwh?: number;
  initialPanelCapacityWatts?: number;
  initialDcToAcDerate?: number;
  solarPanelConfigs?: SolarPanelConfig[];
  defaultPanelCapacityWatts?: number;
  configId: number;
  setConfigId: (id: number) => void;
}) => {
  
  const [monthlyAverageEnergyBill, setMonthlyAverageEnergyBill] = useState(
    initialMonthlyAverageEnergyBill
  );
  const [energyCostPerKwh, setEnergyCostPerKwh] = useState(initialEnergyCostPerKwh);
  const [panelCapacityWatts, setPanelCapacityWatts] = useState(initialPanelCapacityWatts);
  // const [solarIncentives, setSolarIncentives] = useState(7000);
  const [installationCostPerWatt, setInstallationCostPerWatt] = useState(3.0);
  const [installationLifeSpan, setInstallationLifeSpan] = useState(25);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // State for advanced settings
  const [dcToAcDerate, setDcToAcDerate] = useState(initialDcToAcDerate);
  const [efficiencyDepreciationFactor, setEfficiencyDepreciationFactor] = useState(0.995);
  const [costIncreaseFactor, setCostIncreaseFactor] = useState(1.06);
  const [discountRate, setDiscountRate] = useState(1.00);

  // Chart reference
  const costChartRef = useRef(null);
  const [breakEvenYear, setBreakEvenYear] = useState(-1);

  // Calculated values
  const panelCapacityRatio = panelCapacityWatts / defaultPanelCapacityWatts;
  const panelsCount = solarPanelConfigs[configId]?.panelsCount || 0;
  const yearlyEnergyDcKwh = solarPanelConfigs[configId]?.yearlyEnergyDcKwh || 0;
  const installationSizeKw = (panelsCount * panelCapacityWatts) / 1000;
  const installationCostTotal = installationCostPerWatt * installationSizeKw * 1000;
  const solarIncentives = installationCostTotal * 0.30;
  const monthlyKwhEnergyConsumption = monthlyAverageEnergyBill / energyCostPerKwh;
  const yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
  const initialAcKwhPerYear = yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerate;

  // Calculate yearly production and costs
  const yearlyProductionAcKwh = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * Math.pow(efficiencyDepreciationFactor, year)
  );

  const yearlyUtilityBillEstimates = yearlyProductionAcKwh.map((yearlyKwhEnergyProduced, year) => {
    const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
    const billEstimate =
      (billEnergyKwh * energyCostPerKwh * Math.pow(costIncreaseFactor, year)) / 
      Math.pow(discountRate, year);
    return Math.max(billEstimate, 0); // bill cannot be negative
  });

  const remainingLifetimeUtilityBill = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
  const totalCostWithSolar = installationCostTotal + remainingLifetimeUtilityBill - solarIncentives;

  const yearlyCostWithoutSolar = [...Array(installationLifeSpan).keys()].map(
    (year) => 
      (monthlyAverageEnergyBill * 12 * Math.pow(costIncreaseFactor, year)) / 
      Math.pow(discountRate, year)
  );

  const totalCostWithoutSolar = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
  const savings = totalCostWithoutSolar - totalCostWithSolar;
  const energyCovered = yearlyProductionAcKwh[0] / yearlyKwhEnergyConsumption;

  const updateConfig = () => {
    const newConfigId = findSolarConfig(
      solarPanelConfigs,
      yearlyKwhEnergyConsumption,
      panelCapacityRatio,
      dcToAcDerate
    );
    setConfigId(newConfigId);
  };

  useEffect(() => {
    updateConfig();
  }, [monthlyAverageEnergyBill, energyCostPerKwh, panelCapacityWatts, dcToAcDerate]);

  // State to track if Google Charts is loaded
  const [isChartsLoaded, setIsChartsLoaded] = useState(false);

  // Hook to load Google Charts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to load Google Charts
    const loadGoogleCharts = async () => {
      // Check if script is already loaded
      if (window.google?.charts) {
        window.google.charts.load('current', { packages: ['line'] });
        window.google.charts.setOnLoadCallback(() => {
          setIsChartsLoaded(true);
        });
        return;
      }
      
      // Create and load script
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.async = true;
        script.onload = () => {
          if (window.google) {
            window.google.charts.load('current', { packages: ['line'] });
            window.google.charts.setOnLoadCallback(() => {
              setIsChartsLoaded(true);
              resolve(void 0);
            });
          }
        };
        document.head.appendChild(script);
      });
    };

    loadGoogleCharts();
  }, []);

  // Effect to draw chart when Google Charts is loaded and data changes
  useEffect(() => {
    // Only proceed if Charts is loaded, window exists, and we have a chart ref
    if (!isChartsLoaded || typeof window === 'undefined' || !costChartRef.current) {
      return;
    }

    try {
      const year = new Date().getFullYear();

      let costWithSolar = 0;
      const cumulativeCostsWithSolar = yearlyUtilityBillEstimates.map(
        (billEstimate, i) =>
          (costWithSolar +=
            i === 0 ? billEstimate + installationCostTotal - solarIncentives : billEstimate)
      );

      let costWithoutSolar = 0;
      const cumulativeCostsWithoutSolar = yearlyCostWithoutSolar.map(
        (cost) => (costWithoutSolar += cost)
      );

      const newBreakEvenYear = cumulativeCostsWithSolar.findIndex(
        (costWithSolar, i) => costWithSolar <= cumulativeCostsWithoutSolar[i]
      );
      setBreakEvenYear(newBreakEvenYear);

      // Create the data table
      const data = google.visualization.arrayToDataTable([
        ['Year', 'Solar', 'No solar'],
        [year.toString(), 0, 0],
        ...cumulativeCostsWithSolar.map((_, i) => [
          (year + i + 1).toString(),
          cumulativeCostsWithSolar[i],
          cumulativeCostsWithoutSolar[i],
        ]),
      ]);

      // Instantiate and draw the chart
      const chart = new window.google.charts.Line(costChartRef.current);
      const options = window.google.charts.Line.convertOptions({
        title: `Cost analysis for ${installationLifeSpan} years`,
        width: 350,
        height: 200,
      });
      chart.draw(data, options);
    } catch (error) {
      console.error("Error drawing chart:", error);
    }
  }, [
    isChartsLoaded,
    yearlyUtilityBillEstimates,
    yearlyCostWithoutSolar,
    installationCostTotal,
    solarIncentives,
    installationLifeSpan,
  ]);


 

  return (
    <div className="solar-potential-analysis">
      {/* Main Settings Form */}
      <div className="flex flex-col space-y-4 pt-1">
        {/* Monthly average energy bill */}
        <div className="form-group">
          <label className="block mb-1">Monthly average energy bill ($)</label>
          <div className="flex items-center">
            <span className="mr-2">💳</span>
            <input
              type="number"
              value={monthlyAverageEnergyBill}
              onChange={(e) => setMonthlyAverageEnergyBill(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              min="0"
            />
          </div>
        </div>

        {/* Panel Count Slider */}
        <div className="form-group">
          <label className="block mb-1">Number of panels: {panelsCount}</label>
          <div className="flex items-center">
           
            <input
              type="range"
              min="0"
              max={solarPanelConfigs.length - 1 > 96 ? 96 : solarPanelConfigs.length - 1}
              value={configId}
              onChange={(e) => setConfigId(Number(e.target.value))}
              className="w-full"
            />
            {/* <button 
              onClick={updateConfig}
              className="ml-2 p-1 bg-gray-200 rounded"
            >
              
            </button> */}
          </div>
        </div>

        {/* Energy cost per kWh */}
        <div className="form-group">
          <label className="block mb-1">Energy cost per kWh ($)</label>
          <div className="flex items-center">
            
            <input
              type="number"
              value={energyCostPerKwh}
              onChange={(e) => setEnergyCostPerKwh(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Solar incentives */}
        {/* <div className="form-group">
          <label className="block mb-1">Solar incentives ($)</label>
          <div className="flex items-center">
           
            <input
              type="number"
              value={solarIncentives}
              onChange={(e) => setSolarIncentives(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              min="0"
            />
          </div>
        </div> */}

      {/* <div className="form-group">
        <label className="block mb-1">Solar incentives (30%)</label>
        <div className="flex items-center">
          <input
            type="number"
            value={solarIncentives.toFixed(2)}
            readOnly
            className="border rounded px-2 py-1 w-full bg-gray-100"
          />
        </div>
      </div> */}

        {/* Installation cost per Watt */}
        {/* <div className="form-group">
          <label className="block mb-1">Installation cost per Watt ($)</label>
          <div className="flex items-center">
           
            <input
              type="number"
              value={installationCostPerWatt}
              onChange={(e) => setInstallationCostPerWatt(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              step="0.01"
              min="0"
            />
          </div>
        </div> */}

        {/* Panel capacity */}
        <div className="form-group">
          <label className="block mb-1">Panel capacity (Watts)</label>
          <div className="flex items-center">
            
            <input
              type="number"
              value={panelCapacityWatts}
              onChange={(e) => setPanelCapacityWatts(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              min="0"
            />
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        {/* <div className="flex flex-col items-center w-full">
          <button
            className="flex items-center text-blue-600 hover:underline"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            {showAdvancedSettings ? 'Hide' : 'Show'} advanced settings
            <span className="ml-1">{showAdvancedSettings ? '▲' : '▼'}</span>
          </button>
        </div> */}

        {/* Advanced Settings */}
        {/* {showAdvancedSettings && (
          <div className="flex flex-col space-y-4 p-4 bg-gray-50 rounded-lg">
           
            <div className="form-group">
              <label className="block mb-1">Installation lifespan (years)</label>
              <div className="flex items-center">
                
                <input
                  type="number"
                  value={installationLifeSpan}
                  onChange={(e) => setInstallationLifeSpan(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-full"
                  min="1"
                />
              </div>
            </div>

           
            <div className="form-group">
              <label className="block mb-1">DC to AC conversion ({(dcToAcDerate * 100).toFixed(0)}%)</label>
              <div className="flex items-center">
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={dcToAcDerate}
                  onChange={(e) => setDcToAcDerate(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

           
            <div className="form-group">
              <label className="block mb-1">Panel efficiency decline per year ({((1 - efficiencyDepreciationFactor) * 100).toFixed(1)}%)</label>
              <div className="flex items-center">
                
                <input
                  type="range"
                  min="0.9"
                  max="1"
                  step="0.001"
                  value={efficiencyDepreciationFactor}
                  onChange={(e) => setEfficiencyDepreciationFactor(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

           
            <div className="form-group">
              <label className="block mb-1">Energy cost increase per year ({((costIncreaseFactor - 1) * 100).toFixed(1)}%)</label>
              <div className="flex items-center">
                
                <input
                  type="range"
                  min="1"
                  max="1.1"
                  step="0.001"
                  value={costIncreaseFactor}
                  onChange={(e) => setCostIncreaseFactor(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

           
            <div className="form-group">
              <label className="block mb-1">Discount rate per year ({((discountRate - 1) * 100).toFixed(1)}%)</label>
              <div className="flex items-center">
                
                <input
                  type="range"
                  min="1"
                  max="1.1"
                  step="0.001"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
          </div>
        )} */}
      </div>

      {/* Summary Results */}
      <div className="mt-8">
        <div className="flex flex-col space-y-2 m-2">
          <div className="p-4 bg-white rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Solar Potential Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <div>
                  <div className="text-sm text-gray-600">Yearly energy</div>
                  <div>{showNumber(yearlyEnergyDcKwh * panelCapacityRatio)} kWh</div>
                </div>
              </div>
              <div className="flex items-center">
                
                <div>
                  <div className="text-sm text-gray-600">Installation size</div>
                  <div>{showNumber(installationSizeKw)} kW</div>
                </div>
              </div>
              <div className="flex items-center">
                
                <div>
                  <div className="text-sm text-gray-600">Installation cost</div>
                  <div>{showMoney(installationCostTotal)}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div>
                  <div className="text-sm text-gray-600">Potential savings</div>
                  <div>{showMoney(solarIncentives)}</div>
                </div>
              </div>
              <div className="flex items-center">
                
                <div>
                  <div className="text-sm text-gray-600">Energy covered</div>
                  <div>{Math.round(energyCovered * 100)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost chart and table */}
        <div className="mx-2 p-4 bg-white text-gray-800 rounded-lg shadow-lg">
          <div ref={costChartRef} style={{ height: '200px', width: '100%' }}>
            {!isChartsLoaded && (
              <div className="flex items-center justify-center h-full">
                <p>Loading chart...</p>
              </div>
            )}
          </div>
          <div className="w-full text-gray-600 mt-4">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-1">
                    <span className="mr-2">👛</span> Cost without solar
                  </td>
                  <td className="text-right">{showMoney(totalCostWithoutSolar)}</td>
                </tr>
                <tr>
                  <td className="py-1">
                    <span className="mr-2">☀️</span> Cost with solar
                  </td>
                  <td className="text-right">{showMoney(totalCostWithSolar)}</td>
                </tr>
                <tr>
                  <td className="py-1">
                    <span className="mr-2">💵</span> Savings
                  </td>
                  <td className="text-right">{showMoney(savings)}</td>
                </tr>
                <tr>
                  <td className="py-1">
                    <span className="mr-2">⚖️</span> Break even
                  </td>
                  <td className="text-right">
                    {breakEvenYear >= 0
                      ? `${breakEvenYear + new Date().getFullYear() + 1} in ${breakEvenYear + 1} years`
                      : '--'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarPotentialAnalysis;