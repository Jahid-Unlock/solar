// file name: SolarFinancialChartCard.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { showMoney } from '@/types/utils';

export default function SolarFinancialChartCard({
  sharedValues
}: {
  sharedValues: any;
}) {
  const chartRef = useRef(null);
  const [isChartsLoaded, setIsChartsLoaded] = useState(false);
  const [breakEvenYear, setBreakEvenYear] = useState(-1);

  const {
    installationCostTotal,
    solarIncentives,
    yearlyKwhEnergyConsumption,
    energyCostPerKwh,
    monthlyAverageEnergyBill,
    installationLifeSpan,
    costIncreaseFactor,
    discountRate,
    initialAcKwhPerYear
  } = sharedValues;

  const yearlyProductionAcKwh = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * Math.pow(0.995, year)
  );

  const yearlyUtilityBillEstimates = yearlyProductionAcKwh.map((produced, year) => {
    const billKwh = yearlyKwhEnergyConsumption - produced;
    const cost = (billKwh * energyCostPerKwh * Math.pow(costIncreaseFactor, year)) / Math.pow(discountRate, year);
    return Math.max(cost, 0);
  });

  const costWithSolarArr = yearlyUtilityBillEstimates.map((bill, i) =>
    i === 0 ? bill + installationCostTotal - solarIncentives : bill
  );
  const cumulativeWithSolar = costWithSolarArr.reduce((acc, val, i) => {
    acc.push((acc[i - 1] || 0) + val);
    return acc;
  }, [] as number[]);

  const costWithoutSolarArr = [...Array(installationLifeSpan).keys()].map((year) =>
    (monthlyAverageEnergyBill * 12 * Math.pow(costIncreaseFactor, year)) / Math.pow(discountRate, year)
  );
  const cumulativeWithoutSolar = costWithoutSolarArr.reduce((acc, val, i) => {
    acc.push((acc[i - 1] || 0) + val);
    return acc;
  }, [] as number[]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.google?.charts) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        window.google.charts.load('current', { packages: ['line'] });
        window.google.charts.setOnLoadCallback(() => setIsChartsLoaded(true));
      };
      document.head.appendChild(script);
    } else {
      window.google.charts.load('current', { packages: ['line'] });
      window.google.charts.setOnLoadCallback(() => setIsChartsLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!isChartsLoaded || !chartRef.current) return;

    const year = new Date().getFullYear();
    const data = google.visualization.arrayToDataTable([
      ['Year', 'With Solar', 'Without Solar'],
      ...cumulativeWithSolar.map((val, i) => [
        (year + i + 1).toString(),
        val,
        cumulativeWithoutSolar[i]
      ])
    ]);

    const chart = new window.google.charts.Line(chartRef.current);
    const options = {
      title: 'Cost Analysis Over Time',
      width: 350,
      height: 200
    };
    chart.draw(data, window.google.charts.Line.convertOptions(options));

    const breakEven = cumulativeWithSolar.findIndex((v, i) => v <= cumulativeWithoutSolar[i]);
    setBreakEvenYear(breakEven);
  }, [isChartsLoaded, sharedValues]);

  const totalCostWith = cumulativeWithSolar.at(-1) ?? 0;
  const totalCostWithout = cumulativeWithoutSolar.at(-1) ?? 0;
  const savings = totalCostWithout - totalCostWith;

  return (
    <div className="mt-4 p-4 bg-white rounded shadow">
      <div ref={chartRef} style={{ height: '200px', width: '100%' }} />
      <table className="w-full mt-4 text-sm text-gray-700">
        <tbody>
          <tr><td>☀️ Cost with solar</td><td className="text-right">{showMoney(totalCostWith)}</td></tr>
          <tr><td>👛 Cost without solar</td><td className="text-right">{showMoney(totalCostWithout)}</td></tr>
          <tr><td>💵 Savings</td><td className="text-right">{showMoney(savings)}</td></tr>
          <tr><td>⚖️ Break-even year</td><td className="text-right">{breakEvenYear >= 0 ? `${breakEvenYear + 1} years` : '--'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
