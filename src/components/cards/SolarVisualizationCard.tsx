'use client';

import { BuildingInsightsResponse } from '@/types/solar';
import { useState } from 'react';

export default function SolarVisualizationCard(
       { 
        showPanels, 
        setShowPanels, 
        buildingInsights, 
        configId 
        }:
        {
            showPanels: boolean; 
            setShowPanels: (showPanels: boolean) => void;
            buildingInsights: BuildingInsightsResponse | undefined;
            configId: number | undefined
        }) {

    const panelConfig = buildingInsights && configId !== undefined
        ? buildingInsights.solarPotential.solarPanelConfigs[configId]
        : undefined;

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Solar Panel Visualization</h2>
            <div className="flex items-center space-x-2 mb-4">
                <input
                    type="checkbox"
                    id="show-panels"
                    checked={showPanels}
                    onChange={(e) => setShowPanels(e.target.checked)}
                    className="w-4 h-4"
                />
                <label htmlFor="show-panels" className="text-sm font-medium">
                    Show solar panels on map
                </label>
            </div>

            {panelConfig && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-600">Panels shown</div>
                        <div>{panelConfig.panelsCount}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Panel color</div>
                        <div className="h-6 w-full bg-gradient-to-r from-blue-500 to-yellow-500 rounded"></div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Low energy</span>
                            <span>High energy</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}