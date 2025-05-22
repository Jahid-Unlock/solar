"use client";

import { SolarPanelConfig } from "@/types/solar";
import { Slider } from "../ui/slider";

const SolarPanelCountSlider = (
    {
        panelsCount,
        // setPanelsCount,
        solarPanelConfigs,
        configId,
        setConfigId
    }: {
        panelsCount: number;
        // setPanelsCount: (count: number) => void;
        solarPanelConfigs: SolarPanelConfig[];
        configId: number | undefined;
        setConfigId: (id: number) => void;
    }
) => {
  return (
    <div>
        <label className="block mb-2">🧮 Number of panels: {panelsCount}</label>
        {/* <input
          type="range"
          min={0}
          max={solarPanelConfigs.length - 1}
          value={configId}
          onChange={(e) => setConfigId(Number(e.target.value))}
          className="w-full"
        /> */}

            <Slider
                defaultValue={[configId || 0]}
                max={Math.min(96, solarPanelConfigs.length - 1)}
                step={1}
                onValueChange={(value) => setConfigId(value[0])}
              />  
    </div>
  );
};

export default SolarPanelCountSlider;


