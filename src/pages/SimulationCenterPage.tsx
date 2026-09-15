import React, { useState } from 'react';
import { useMedFlow } from '../context/MedFlowContext';
import { 
  Sliders, 
  Truck, 
  TrendingUp, 
  ShieldAlert, 
  Play, 
  RotateCcw, 
  Sparkles, 
  PackageCheck,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const SimulationCenterPage: React.FC = () => {
  const { 
    facilities, 
    inventory, 
    applySupplierDelay, 
    applyDemandSpike, 
    reduceStock, 
    startLiveScenario, 
    resetScenario,
    isScenarioRunning, 
    activeScenarioStep,
    recommendations,
    approveTransfer
  } = useMedFlow();

  // Controls local state
  const [selectedSupplier, setSelectedSupplier] = useState('PharmaCore Logistics');
  const [delayDays, setDelayDays] = useState(5);

  const [spikeFacility, setSpikeFacility] = useState(facilities[0]?.id || '');
  const [spikeMedicine, setSpikeMedicine] = useState(inventory[0]?.medicineId || '');
  const [spikePercentage, setSpikePercentage] = useState(40);

  const [dropFacility, setDropFacility] = useState(facilities[0]?.id || '');
  const [dropMedicine, setDropMedicine] = useState(inventory[0]?.medicineId || '');
  const [dropPercentage, setDropPercentage] = useState(50);

  const pendingRecs = recommendations.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-cyan-400" />
          Disruption Simulation Center
        </h2>
        <p className="text-xs text-slate-400">
          Trigger real-time logistics delays, epidemic demand spikes, or supply chain drops to test system prediction & redistribution resilience.
        </p>
      </div>

      {/* Prebuilt Live Scenario Interactive Card */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Prebuilt Live Demo Walkthrough
            </span>
            <h3 className="text-lg font-bold text-white">Full-Spectrum Crisis & Recovery Simulation</h3>
            <p className="text-xs text-slate-400">
              Simulates a 5-day supplier failure, regional risk spike to 78%, AI surplus detection, and 12% risk drop recovery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={startLiveScenario}
              disabled={isScenarioRunning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isScenarioRunning ? 'Scenario Running...' : 'Launch Live Demo Scenario'}</span>
            </button>
            <button
              onClick={resetScenario}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title="Reset Scenario"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Scenario Timeline Progress Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Step 1 */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeScenarioStep === 1 ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-500/20' : 'bg-slate-900/60 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Step 1: 10:00 AM</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">Normal</span>
            </div>
            <div className="font-sans font-bold text-white mb-1">Baseline Operations</div>
            <p className="text-[11px] font-sans text-slate-400">All 6 facilities report green healthy stock levels.</p>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeScenarioStep === 2 ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-900/60 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Step 2: +1 Minute</span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">Delay</span>
            </div>
            <div className="font-sans font-bold text-white mb-1">5-Day Supplier Failure</div>
            <p className="text-[11px] font-sans text-slate-400">PharmaCore delays delivery. Hospitals A & B turn Amber, Hospital C Critical!</p>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeScenarioStep === 3 ? 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-slate-900/60 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Step 3: +2 Minutes</span>
              <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">78% Risk</span>
            </div>
            <div className="font-sans font-bold text-white mb-1">AI Recommendation & Recovery</div>
            <p className="text-[11px] font-sans text-slate-400">Detects Hospital D 1,400 surplus units. Transfer 600 units → Risk 78% to 12%!</p>
          </div>
        </div>

        {/* Quick Approve Action inside Scenario player */}
        {activeScenarioStep === 3 && pendingRecs.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/60 flex items-center justify-between">
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-cyan-300 block">AI Recommended Transfer Ready:</span>
              <span className="text-slate-300 font-mono">Transfer 600 units Insulin: Hospital D ➔ Hospital C</span>
            </div>
            <button
              onClick={() => approveTransfer(pendingRecs[0].id)}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <PackageCheck className="w-4 h-4 text-slate-950" /> Approve Transfer (Drop Risk to 12%)
            </button>
          </div>
        )}
      </div>

      {/* Manual Simulation Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tool 1: Supplier Delay */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-amber-400" />
            Simulate Supplier Delay
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Select Supplier Route:</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500"
              >
                <option value="PharmaCore Logistics">PharmaCore Logistics</option>
                <option value="Global Med Supply">Global Med Supply</option>
                <option value="MediTrust Express">MediTrust Express</option>
                <option value="BioPharma Direct">BioPharma Direct</option>
                <option value="Apex Health Corp">Apex Health Corp</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Delay Duration (Days):</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 8].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDelayDays(d)}
                    className={`py-1.5 rounded text-xs font-mono font-bold ${
                      delayDays === d ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
                    }`}
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => applySupplierDelay(selectedSupplier, delayDays)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              Apply Supplier Delay (+{delayDays} Days)
            </button>
          </div>
        </div>

        {/* Tool 2: Demand Spike */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Simulate Demand Spike
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Facility Target:</label>
              <select
                value={spikeFacility}
                onChange={(e) => setSpikeFacility(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500"
              >
                <option value="">All Facilities</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Demand Surge Increase (%):</label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={spikePercentage}
                onChange={(e) => setSpikePercentage(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="text-right font-mono text-cyan-400 font-bold text-xs">
                +{spikePercentage}% Consumption
              </div>
            </div>

            <button
              onClick={() => applyDemandSpike(spikeFacility, spikeMedicine, spikePercentage)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              Trigger Demand Spike (+{spikePercentage}%)
            </button>
          </div>
        </div>

        {/* Tool 3: Stock Drop */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Simulate Inventory Drop
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Facility Target:</label>
              <select
                value={dropFacility}
                onChange={(e) => setDropFacility(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500"
              >
                <option value="">All Facilities</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Stock Reduction Percentage (%):</label>
              <input
                type="range"
                min="10"
                max="80"
                step="10"
                value={dropPercentage}
                onChange={(e) => setDropPercentage(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="text-right font-mono text-rose-400 font-bold text-xs">
                -{dropPercentage}% Inventory Drop
              </div>
            </div>

            <button
              onClick={() => reduceStock(dropFacility, dropMedicine, dropPercentage)}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
            >
              Reduce Stock (-{dropPercentage}%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
