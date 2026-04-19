export interface Vehicle {
  id: string;
  type: 'Truck' | 'Van' | 'Bike';
  capacity: number; // in kg
  fuelEfficiency: number; // km per liter
  status: 'active' | 'maintenance' | 'idle';
}

export interface Driver {
  id: string;
  name: string;
  maxHours: number;
  available: boolean;
}

export interface DeliveryJob {
  id: string;
  location: string;
  weight: number;
  revenue: number;
  distance: number; // distance from hub
  priority: 'low' | 'medium' | 'high';
  coordinates?: { lat: number; lng: number };
}

export interface OptimizationResult {
  assignedJobs: string[];
  totalRevenue: number;
  totalProfit: number;
  totalDistance: number;
  totalFuelUsed: number;
  efficiency: number;
  recommendations: string[];
}
