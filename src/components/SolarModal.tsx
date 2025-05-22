import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SolarAnalysisGrid from './SolarAnalysisGrid';
import { useSolarData } from '@/hooks/useSolarData';

export default function SolarModal({
  open,
  setOpen,
  location,
  map,
  geometryLibrary,
  googleMapsApiKey,
  monthlyAverageEnergyBillInput,
  panelCapacityWattsInput,
  energyCostPerKwhInput
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  location: google.maps.LatLng | null;
  map: google.maps.Map | null;
  geometryLibrary: google.maps.GeometryLibrary | null;
  googleMapsApiKey: string;
  monthlyAverageEnergyBillInput: number;
  panelCapacityWattsInput: number;
  energyCostPerKwhInput: number;
}) {
  const [showPanels, setShowPanels] = useState(true);
  const [dcToAcDerate] = useState(0.90);

  const {
    buildingInsights,
    configId,
    setConfigId,
    loading,
    error
  } = useSolarData(
    location,
    googleMapsApiKey,
    monthlyAverageEnergyBillInput,
    energyCostPerKwhInput,
    panelCapacityWattsInput,
    dcToAcDerate
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[1000px] bg-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle>Solar Analysis Report</DialogTitle>
          <DialogDescription>
            Solar potential and financial analysis for your property
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4">
            Error: {error.message}
          </div>
        ) : (
          <SolarAnalysisGrid 
            buildingInsights={buildingInsights}
            configId={configId}
            setConfigId={setConfigId}
            showPanels={showPanels}
            setShowPanels={setShowPanels}
            location={location}
            map={map}
            geometryLibrary={geometryLibrary}
            googleMapsApiKey={googleMapsApiKey}
            monthlyAverageEnergyBillInput={monthlyAverageEnergyBillInput}
            panelCapacityWattsInput={panelCapacityWattsInput}
            energyCostPerKwhInput={energyCostPerKwhInput}
            dcToAcDerate={dcToAcDerate}
          />
        )}
        
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}