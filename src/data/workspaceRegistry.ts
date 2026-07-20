export interface WorkspaceFacility {
  id: string;
  name: string;
  type: 'Medical College' | 'District Hospital' | 'Community Health Centre' | 'Primary Health Centre';
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  catchmentArea: string;
  supportedPHCs?: string[];
  supportedVillages?: string[];
}

export const workspaceRegistry: WorkspaceFacility[] = [
  {
    id: 'ws-cuttack-scb',
    name: 'SCB Medical College',
    type: 'Medical College',
    state: 'Odisha',
    district: 'Cuttack',
    latitude: 20.4625,
    longitude: 85.8828,
    catchmentArea: 'Eastern Odisha region',
    supportedPHCs: ['Mangalabag PHC', 'Buxi Bazaar PHC']
  },
  {
    id: 'ws-patna-dhh',
    name: 'Patna District Headquarters Hospital',
    type: 'District Hospital',
    state: 'Bihar',
    district: 'Patna',
    latitude: 25.6200,
    longitude: 85.0400,
    catchmentArea: 'Patna District',
    supportedPHCs: ['Phulwari PHC', 'Khagaul PHC', 'Maner PHC', 'Bihta PHC']
  },
  {
    id: 'ws-phulwari-chc',
    name: 'Phulwari Community Health Centre',
    type: 'Community Health Centre',
    state: 'Bihar',
    district: 'Patna',
    latitude: 25.5900,
    longitude: 85.0900,
    catchmentArea: 'Phulwari Block',
    supportedVillages: ['Phulwari Sharif', 'Khagaul', 'Danapur']
  },
  {
    id: 'ws-bbsr-capital',
    name: 'Capital Hospital',
    type: 'District Hospital',
    state: 'Odisha',
    district: 'Khordha',
    latitude: 20.2706,
    longitude: 85.8333,
    catchmentArea: 'Bhubaneswar Capital Region',
  },
  {
    id: 'ws-delhi-aiims',
    name: 'AIIMS New Delhi',
    type: 'Medical College',
    state: 'Delhi',
    district: 'New Delhi',
    latitude: 28.5665,
    longitude: 77.2100,
    catchmentArea: 'North India (Apex)',
  },
  {
    id: 'ws-blr-victoria',
    name: 'Victoria Hospital',
    type: 'District Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    latitude: 12.9625,
    longitude: 77.5746,
    catchmentArea: 'Central Bengaluru',
  }
];
