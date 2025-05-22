declare module 'google-charts' {
  export const GoogleCharts: {
    load: (callback: () => void, options?: { packages: string[] }) => void;
  };
}

declare namespace google {
  namespace visualization {
    class DataTable {
      constructor(data: any[][]);
    }
    function arrayToDataTable(data: any[][]): DataTable;
  }
  namespace charts {
    class Line {
      constructor(element: HTMLElement);
      draw(data: any, options: any): void;
      static convertOptions(options: any): any;
    }
    function load(version: string, options: { packages: string[] }): void;
    function setOnLoadCallback(callback: () => void): void;
  }
} 