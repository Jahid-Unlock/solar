"use client";

const SolarPanelSlider = (
    {
        panelCapacityWatts,
        setCalculatorInputs,
        calculatorInputs
    }: {
        panelCapacityWatts: number;
        setCalculatorInputs: (inputs: any) => void;
        calculatorInputs: any;
    }
) => {
  return (
    <div>
        <label className="block mb-1">🔋 Panel capacity (Watts)</label>
        <input
          type="number"
          value={panelCapacityWatts}
          min={0}
          onChange={(e) =>
            setCalculatorInputs({
              ...calculatorInputs,
              panelCapacityWatts: Number(e.target.value)
            })
          }
          className="w-full border rounded px-2 py-1"
        />
      </div>
  )
};

export default SolarPanelSlider;


