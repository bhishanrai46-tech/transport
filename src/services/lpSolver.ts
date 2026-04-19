// @ts-ignore - solver doesn't have official types often
import solver from 'javascript-lp-solver';
import { Vehicle, DeliveryJob, OptimizationResult } from '../types';

export const optimizeFleet = (
  vehicles: Vehicle[],
  jobs: DeliveryJob[],
  fuelPrice: number = 1.2
): OptimizationResult => {
  // We want to maximize total revenue
  // Subject to:
  // 1. Total weight assigned to each vehicle <= vehicle capacity
  // 2. Total fuel cost for all vehicles <= budget (or we just calculate it)
  // Let's simplify: Maximize Sum(Job_i * Revenue_i)
  // Subject to: 
  //   Sum(Job_i_assigned_to_Veh_j * Weight_i) <= Capacity_j
  //   Each job assigned to at most 1 vehicle
  
  const model: any = {
    optimize: 'revenue',
    opType: 'max',
    constraints: {},
    variables: {},
    ints: {} // decision variables should be binary (assigned or not)
  };

  // 1. Define Constraints
  // Capacity constraints for each vehicle
  vehicles.forEach((v) => {
    model.constraints[`cap_${v.id}`] = { max: v.capacity };
  });

  // Unique assignment constraints (each job assigned at most once)
  jobs.forEach((j) => {
    model.constraints[`job_${j.id}`] = { max: 1 };
  });

  // 2. Define Variables
  // Variable: x_j_v (Job i assigned to Vehicle v)
  jobs.forEach((j) => {
    vehicles.forEach((v) => {
      const varName = `${j.id}_to_${v.id}`;
      const fuelCost = (j.distance / v.fuelEfficiency) * fuelPrice;
      const profit = j.revenue - fuelCost;
      
      model.variables[varName] = {
        revenue: profit, // Maximizing profit
        [`cap_${v.id}`]: j.weight,
        [`job_${j.id}`]: 1
      };
      model.ints[varName] = 1; // Binary constraint (assigned or not)
    });
  });

  const solution = solver.Solve(model);
  
  const assignedJobsIds: string[] = [];
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalDistance = 0;
  let totalFuelUsed = 0;

  // Process solution
  Object.keys(solution).forEach(key => {
    if (solution[key] === 1 && key.includes('_to_')) {
      const [jobId, vId] = key.split('_to_');
      const job = jobs.find(j => j.id === jobId);
      const vehicle = vehicles.find(v => v.id === vId);
      
      if (job && vehicle) {
        assignedJobsIds.push(jobId);
        const fuelCost = (job.distance / vehicle.fuelEfficiency) * fuelPrice;
        totalRevenue += job.revenue;
        totalProfit += (job.revenue - fuelCost);
        totalDistance += job.distance;
        totalFuelUsed += job.distance / vehicle.fuelEfficiency;
      }
    }
  });

  return {
    assignedJobs: assignedJobsIds,
    totalRevenue,
    totalProfit,
    totalDistance,
    totalFuelUsed,
    efficiency: totalProfit > 0 ? (totalProfit / (totalDistance * fuelPrice + 1)) : 0,
    recommendations: [] 
  };
};
