import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Package, 
  TrendingUp, 
  Map as MapIcon, 
  BrainCircuit, 
  Settings, 
  Plus, 
  RefreshCcw,
  Fuel,
  Navigation,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Vehicle, DeliveryJob, OptimizationResult } from './types';
import { optimizeFleet } from './services/lpSolver';
import { getStrategicInsights } from './services/geminiService';

const HUB_LOCATION = { lat: 40.7128, lng: -74.0060 };

// Mock Initial Data with Coordinates
const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'V1', type: 'Truck', capacity: 1000, fuelEfficiency: 8, status: 'active' },
  { id: 'V2', type: 'Truck', capacity: 1200, fuelEfficiency: 7.5, status: 'active' },
  { id: 'V3', type: 'Van', capacity: 500, fuelEfficiency: 12, status: 'active' },
  { id: 'V4', type: 'Van', capacity: 450, fuelEfficiency: 14, status: 'active' },
  { id: 'V5', type: 'Bike', capacity: 20, fuelEfficiency: 40, status: 'idle' },
];

const INITIAL_JOBS: DeliveryJob[] = [
  { id: 'J1', location: 'Downtown A', weight: 400, revenue: 1500, distance: 15, priority: 'high', coordinates: { lat: 40.7306, lng: -73.9352 } },
  { id: 'J2', location: 'Suburbs B', weight: 800, revenue: 2200, distance: 45, priority: 'medium', coordinates: { lat: 40.8506, lng: -74.1352 } },
  { id: 'J3', location: 'Industrial Zone C', weight: 1100, revenue: 3500, distance: 30, priority: 'high', coordinates: { lat: 40.6506, lng: -73.8352 } },
  { id: 'J4', location: 'Retail Park D', weight: 200, revenue: 800, distance: 20, priority: 'low', coordinates: { lat: 40.7806, lng: -74.2352 } },
  { id: 'J5', location: 'Port Area E', weight: 950, revenue: 4200, distance: 55, priority: 'high', coordinates: { lat: 40.5306, lng: -74.3352 } },
  { id: 'J6', location: 'Airport F', weight: 300, revenue: 1200, distance: 60, priority: 'medium', coordinates: { lat: 40.9306, lng: -73.5352 } },
  { id: 'J7', location: 'Tech Park G', weight: 150, revenue: 950, distance: 10, priority: 'low', coordinates: { lat: 40.7506, lng: -74.0352 } },
  { id: 'J8', location: 'Logistics Hub H', weight: 2000, revenue: 6000, distance: 40, priority: 'high', coordinates: { lat: 40.4306, lng: -73.9352 } },
];

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [jobs, setJobs] = useState<DeliveryJob[]>(INITIAL_JOBS);
  const [fuelPrice, setFuelPrice] = useState(1.45);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'jobs' | 'ai'>('overview');
  const [isSolving, setIsSolving] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);

  const handleOptimize = async () => {
    setIsSolving(true);
    // Mimic real computation time
    setTimeout(async () => {
      const result = optimizeFleet(vehicles, jobs, fuelPrice);
      setOptimizationResult(result);
      setIsSolving(false);
      
      // Get AI insights
      const insights = await getStrategicInsights(result, vehicles, jobs);
      setAiInsights(insights);
    }, 1200);
  };

  useEffect(() => {
    handleOptimize();
  }, []);

  const stats = useMemo(() => {
    if (!optimizationResult) return null;
    return [
      { label: 'Net Profit', value: `$${optimizationResult.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-600' },
      { label: 'Gross Revenue', value: `$${optimizationResult.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600' },
      { label: 'Fuel Expense', value: `$${(optimizationResult.totalFuelUsed * fuelPrice).toFixed(2)}`, icon: Fuel, color: 'text-amber-600' },
      { label: 'Efficiency', value: `${(optimizationResult.efficiency * 100).toFixed(1)}%`, icon: Globe, color: 'text-purple-600' },
    ];
  }, [optimizationResult, fuelPrice]);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] text-[var(--ink)] border-[8px] border-[var(--ink)] overflow-hidden font-sans">
      {/* Header */}
      <header className="h-[60px] border-b-2 border-[var(--line)] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-lg tracking-[2px] flex items-center gap-2 uppercase">
              RouteLogix_v4.2
            </span>
            <div className="bg-[var(--ink)] text-[var(--bg)] px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">
              Live Solver Active
            </div>
          </div>
          <div className="h-4 w-[1px] bg-[var(--line)] mx-2" />
          <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <NavItem label="Network_Map" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <NavItem label="Fleet_Inventory" active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
            <NavItem label="Job_Manifest" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
            <NavItem label="Strategic_AI" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          </nav>
        </div>
        <div className="font-mono text-[11px] text-[var(--dim)] hidden md:block">
          SESSION: RL-{Math.random().toString(36).substr(2, 4).toUpperCase()}-DELTA // LOGISTICS_SECTOR
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 grid grid-cols-[280px_1fr_260px] divide-x divide-[var(--line)]"
            >
              {/* Left Panel: Parameters */}
              <div className="flex flex-col overflow-hidden bg-[rgba(0,0,0,0.02)]">
                <div className="italic-serif p-3 bg-[rgba(0,0,0,0.03)] border-b border-[var(--line)]">Optimization Constraints</div>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 border-b border-[var(--line)]">
                    <div className="flex justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--dim)] font-bold">Fuel_Index ($/L)</span>
                      <span className="mono-value text-xs">{fuelPrice.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3.5" 
                      step="0.01"
                      value={fuelPrice} 
                      onChange={(e) => setFuelPrice(parseFloat(e.target.value))}
                      className="w-full accent-[var(--ink)] cursor-pointer"
                    />
                  </div>

                  <div className="p-4 border-b border-[var(--line)]">
                    <div className="flex justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--dim)] font-bold">Max_Capacity_Util</span>
                      <span className="mono-value text-xs">85%</span>
                    </div>
                    <input type="range" className="w-full accent-[var(--ink)]" disabled />
                  </div>

                  <div className="p-4 border-b border-[var(--line)]">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--dim)] font-bold block mb-3">Objective_Function</span>
                    <div className="font-mono text-[11px] bg-white p-3 border border-[var(--line)] leading-relaxed">
                      MAX Z = Σ(Rᵢxᵢ) - Σ(Cⱼyⱼ)<br/>
                      WHERE R=REVENUE, C=FUEL_COST
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-[var(--line)] bg-[var(--bg)]">
                  <button 
                    onClick={handleOptimize}
                    disabled={isSolving}
                    className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-3 shadow-inner"
                  >
                    <RefreshCcw size={14} className={isSolving ? "animate-spin" : ""} />
                    {isSolving ? "Executing_Simplex" : "Run_Optimization"}
                  </button>
                </div>
              </div>

              {/* Middle Panel: Map and Table */}
              <div className="flex flex-col overflow-hidden bg-white">
                <div className="italic-serif p-3 bg-[rgba(0,0,0,0.03)] border-b border-[var(--line)] uppercase">Spatial Load Map</div>
                <div className="h-2/5 relative bg-[#E8E7E4] border-b border-[var(--line)]">
                  <DeliveryMap jobs={jobs} optimizationResult={optimizationResult} />
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="italic-serif p-3 border-b border-[var(--line)] bg-[rgba(0,0,0,0.03)] uppercase">Optimized Route Queues</div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="data-table w-full text-left">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="p-2 pl-4">Job_ID</th>
                          <th className="p-2">Priority</th>
                          <th className="p-2">Weight</th>
                          <th className="p-2">Expected_Rev</th>
                          <th className="p-2 pr-4">LP_Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map(job => (
                          <tr key={job.id} className={`hover:bg-[rgba(255,95,0,0.05)] ${optimizationResult?.assignedJobs.includes(job.id) ? 'bg-[rgba(255,95,0,0.02)]' : ''}`}>
                            <td className="p-2 pl-4">{job.id}</td>
                            <td className="p-2 text-[10px] font-bold uppercase">{job.priority}</td>
                            <td className="p-2">{job.weight}kg</td>
                            <td className="p-2 mono-value">${job.revenue}</td>
                            <td className="p-2 pr-4 text-[10px]">
                              {optimizationResult?.assignedJobs.includes(job.id) ? 
                                <span className="text-[var(--accent)] font-bold tracking-tight">ALLOCATED</span> : 
                                <span className="text-[var(--dim)]">DEFERRED</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Panel: Metrics & AI */}
              <div className="flex flex-col overflow-hidden bg-[rgba(0,0,0,0.02)]">
                <div className="italic-serif p-3 bg-[rgba(0,0,0,0.03)] border-b border-[var(--line)]">Fleet Performance</div>
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <div className="p-5 border-b border-[var(--line)]">
                    <div className="text-[10px] font-bold text-[var(--dim)] uppercase mb-1">Net_Profit_Margin</div>
                    <div className="text-3xl font-light tracking-tight mono-value text-emerald-600">
                      ${optimizationResult?.totalProfit.toLocaleString() || '---'}
                    </div>
                    {optimizationResult && (
                      <div className="text-[10px] text-emerald-600 font-bold mt-2">
                        +{((optimizationResult.totalProfit / (optimizationResult.totalRevenue || 1)) * 100).toFixed(1)}% MARGIN
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-b border-[var(--line)]">
                    <div className="text-[10px] font-bold text-[var(--dim)] uppercase mb-1">Efficiency_Index</div>
                    <div className="text-2xl font-light mono-value">
                      {optimizationResult ? (optimizationResult.efficiency * 10).toFixed(2) : '---'} <span className="text-sm">Σ</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-[10px] font-bold text-[var(--dim)] uppercase mb-3">AI_System_Logs</div>
                    <div className="font-mono text-[9px] space-y-2 leading-relaxed h-[200px] overflow-y-auto no-scrollbar">
                      {aiInsights ? (
                        <div className="space-y-3">
                          <p>[{new Date().toLocaleTimeString()}] Analysis loaded.</p>
                          <p className="text-[var(--accent)] font-bold uppercase">Summary:</p>
                          <p className="text-gray-600 italic leading-snug">{aiInsights.summary}</p>
                          <p className="border-t border-[var(--line)] pt-2 opacity-50">------------------------</p>
                          <p className="text-[var(--accent)] font-bold uppercase">Recommendations:</p>
                          {aiInsights.recommendations?.map((r: string, i: number) => (
                            <p key={i}> {`> `}{r}</p>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p>[10:42:01] Init Kernal RL-4.2...</p>
                          <p>[10:42:02] Fetching optimization context...</p>
                          <p className="animate-pulse">[...] consulting strategic models...</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 mt-auto bg-[var(--ink)] text-[var(--bg)] font-mono text-[9px] uppercase tracking-wider space-y-1">
                  <div>Kernel: RL-v4.2-STABLE</div>
                  <div>Load: 124ms // Iter: 12.4k</div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'ai' ? (
            <motion.div 
              key="ai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col bg-white overflow-hidden"
            >
              <div className="italic-serif p-3 bg-[var(--ink)] text-[var(--bg)] uppercase tracking-widest flex items-center gap-3">
                <BrainCircuit size={16} />
                Strategic AI Analysis
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[var(--bg)]">
                {aiInsights ? (
                  <div className="max-w-4xl mx-auto space-y-10">
                    <section className="bg-white border border-[var(--line)] p-6 shadow-sm">
                      <h3 className="text-[10px] font-bold text-[var(--dim)] uppercase tracking-widest mb-4 border-b border-[var(--line)] pb-2 italic-serif">Optimization Result Summary</h3>
                      <p className="text-[14px] leading-relaxed font-medium text-[var(--ink)]">
                        {aiInsights.summary}
                      </p>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-[var(--line)] p-6">
                        <h3 className="text-[10px] font-bold text-[var(--dim)] uppercase tracking-widest mb-4 border-b border-[var(--line)] pb-2 italic-serif">Tactical Fleet Recommendations</h3>
                        <div className="space-y-4 font-mono text-xs">
                          {aiInsights.recommendations?.map((rec: string, i: number) => (
                            <div key={i} className="flex gap-3">
                              <span className="text-[var(--accent)] font-bold">[{i+1}]</span>
                              <p className="leading-snug">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-[#141414] text-[#E4E3E0] p-6 border border-[#141414]">
                        <h3 className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-4 border-b border-gray-700 pb-2 italic-serif">Simulated Fleet Analysis</h3>
                        <p className="font-mono text-[11px] leading-relaxed italic">
                          {aiInsights.fleetAnalysis}
                        </p>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--dim)] font-mono animate-pulse">
                    <BrainCircuit size={48} className="mb-4" />
                    <p>[ INITIALIZING_STRATEGIC_KERNEL ]</p>
                    <p className="text-[10px] mt-2 italic">Consulting predictive logistic models...</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-[var(--ink)] text-[var(--bg)] font-mono text-[9px] uppercase">
                Status: Neural_Processor_Online // Confidence: 0.982
              </div>
            </motion.div>
          ) : activeTab === 'fleet' ? (
            <motion.div 
              key="fleet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col bg-white overflow-hidden"
            >
              <div className="italic-serif p-3 bg-[rgba(0,0,0,0.03)] border-b border-[var(--line)] uppercase tracking-wider flex justify-between items-center">
                <span>Active_Fleet_Inventory</span>
                <button className="bg-[var(--ink)] text-[var(--bg)] px-3 py-1 text-[10px] font-mono flex items-center gap-2 hover:opacity-80">
                  <Plus size={12} /> ADD_ASSET
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="data-table w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="p-2 pl-4">Asset ID</th>
                      <th className="p-2 border-l border-[var(--line)]">Class</th>
                      <th className="p-2 border-l border-[var(--line)]">Capacity</th>
                      <th className="p-2 border-l border-[var(--line)]">Efficiency</th>
                      <th className="p-2 border-l border-[var(--line)] pr-4">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                        <td className="p-3 pl-4 font-bold">{v.id}</td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2 uppercase font-bold text-[11px]">
                            <Truck size={12} className="text-[var(--accent)]" /> {v.type}
                          </div>
                        </td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)] italic text-sm">{v.capacity}kg</td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)] italic text-sm">{v.fuelEfficiency}km/L</td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)] pr-4">
                          <StatusBadge status={v.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : activeTab === 'jobs' ? (
            <motion.div 
              key="jobs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col bg-white overflow-hidden"
            >
              <div className="italic-serif p-3 bg-[rgba(0,0,0,0.03)] border-b border-[var(--line)] uppercase tracking-wider flex justify-between items-center">
                <span>Delivery_Job_Manifest</span>
                <div className="flex gap-2">
                  <button className="border border-[var(--line)] text-[var(--ink)] px-3 py-1 text-[10px] font-mono hover:bg-gray-100 transition-colors uppercase">
                    Export_CSV
                  </button>
                  <button className="bg-[var(--ink)] text-[var(--bg)] px-3 py-1 text-[10px] font-mono hover:opacity-80 transition-opacity uppercase">
                    Import_Batch
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="data-table w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="p-2 pl-4">Job_ID</th>
                      <th className="p-2 border-l border-[var(--line)]">Target_Area</th>
                      <th className="p-2 border-l border-[var(--line)]">Payload</th>
                      <th className="p-2 border-l border-[var(--line)]">Revenue</th>
                      <th className="p-2 border-l border-[var(--line)]">Priority</th>
                      <th className="p-2 border-l border-[var(--line)] pr-4">LP_Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                        <td className="p-3 pl-4 font-bold">{j.id}</td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)]">
                          <div className="font-bold flex flex-col uppercase text-[11px]">
                            {j.location}
                            <span className="text-[9px] font-normal italic opacity-60 lowercase mt-0.5">{j.distance}km from base</span>
                          </div>
                        </td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)] italic text-sm">{j.weight}kg</td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)] mono-value text-[var(--accent)] text-sm">${j.revenue.toLocaleString()}</td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)]">
                          <PriorityBadge priority={j.priority} />
                        </td>
                        <td className="p-3 border-l border-[rgba(0,0,0,0.05)] pr-4 uppercase text-[10px] font-bold">
                          {optimizationResult?.assignedJobs.includes(j.id) ? (
                             <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Optimized</span>
                          ) : (
                            <span className="text-[var(--dim)] flex items-center gap-1"><AlertCircle size={10} /> Deferred</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 p-10 font-mono text-[var(--dim)] flex items-center justify-center text-center italic">
              <div>
                [ Accessing Sub-System: {activeTab.toUpperCase()} ]<br/>
                <span className="text-xs mt-2 inline-block">Rendering legacy module interface...</span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-[40px] border-t-2 border-[var(--line)] flex items-center px-5 gap-6 text-[10px] font-mono tracking-tight shrink-0">
        <div className="flex items-center gap-2">
          <span className="indicator bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
          <span>SYSTEM_READY</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="indicator bg-[var(--accent)] shadow-[0_0_5px_rgba(255,95,0,0.5)]"></span>
          <span>LP_CONVERGED_7</span>
        </div>
        <div className="ml-auto text-[var(--dim)]">
          COORD: 40.7128° N, 74.0060° W
        </div>
        <div className="text-[var(--dim)] uppercase">
          UTC: {new Date().toISOString().substr(11, 8)}
        </div>
      </footer>
    </div>
  );
}

function NavItem({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
        px-3 py-1 text-[11px] font-mono transition-all lowercase relative
        ${active ? 'text-[var(--ink)] font-bold' : 'text-[var(--dim)] hover:text-[var(--ink)]'}
      `}
    >
      {active && <span className="absolute -left-1 text-[var(--accent)] font-bold">{`>`}</span>}
      {label}
      {active && <div className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-[var(--accent)] z-20" />}
    </button>
  );
}

function DeliveryMap({ jobs, optimizationResult }: { jobs: DeliveryJob[], optimizationResult: OptimizationResult | null }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(function callback(m: any) {
    setMap(m);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="h-full w-full flex items-center justify-center font-mono text-xs text-[var(--dim)]">LOADING_GMAPS_SDK...</div>;

  const assignedJobs = jobs.filter(j => optimizationResult?.assignedJobs.includes(j.id));

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={HUB_LOCATION}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: true,
        styles: [
          { "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] },
          { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] },
          { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] },
          { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] },
          { "featureType": "administrative.land_parcel", "elementType": "geometry.stroke", "stylers": [{ "color": "#dcd2be" }] },
          { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
          { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] },
          { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b9d3c2" }] }
        ]
      }}
    >
      <Marker 
        position={HUB_LOCATION} 
        label={{ text: 'HUB', color: 'white', fontWeight: 'bold' }}
        icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      />
      {jobs.map(job => (
        job.coordinates && (
          <Marker
            key={job.id}
            position={job.coordinates}
            icon={optimizationResult?.assignedJobs.includes(job.id) ? "https://maps.google.com/mapfiles/ms/icons/orange-dot.png" : "https://maps.google.com/mapfiles/ms/icons/grey-dot.png"}
          />
        )
      ))}
      {assignedJobs.map(job => (
        job.coordinates && (
          <Polyline
            key={job.id}
            path={[HUB_LOCATION, job.coordinates]}
            options={{
              strokeColor: "#FF5F00",
              strokeOpacity: 0.6,
              strokeWeight: 2,
            }}
          />
        )
      ))}
    </GoogleMap>
  );
}

function SummaryItem({ label, value, progress }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">{label}</span>
        <span className="text-sm font-bold mono-value">{value}</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Vehicle['status'] }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    maintenance: 'bg-amber-50 text-amber-600 border-amber-100',
    idle: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: DeliveryJob['priority'] }) {
  const styles = {
    high: 'text-rose-500',
    medium: 'text-amber-500',
    low: 'text-indigo-400'
  };
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-tighter ${styles[priority]}`}>
      <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {priority}
    </span>
  );
}
