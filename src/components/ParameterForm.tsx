import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ParameterFormProps {
  age: number | '';
  setAge: (v: number | '') => void;
  withdrawalStartAge: number | '';
  setWithdrawalStartAge: (v: number | '') => void;

  withdrawalYear: number | '';
  setWithdrawalYear: (v: number | '') => void;
  initialCorpus: number | '';
  setInitialCorpus: (v: number | '') => void;
  equityAllocation: number | '';
  setEquityAllocation: (v: number | '') => void;
  realEstateAllocation: number | '';
  setRealEstateAllocation: (v: number | '') => void;
  passiveAllocation: number | '';
  setPassiveAllocation: (v: number | '') => void;
  debtAllocation: number | '';
  setDebtAllocation: (v: number | '') => void;
  altAllocation: number | '';
  setAltAllocation: (v: number | '') => void;
  simulationType: 'expenses' | 'swr';
  setSimulationType: (v: 'expenses' | 'swr') => void;
}

function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Hide label for tiny slices

  return (
    <text 
      x={x} 
      y={y} 
      fill="#111827" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontWeight="700"
      fontSize="0.75rem"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};


export function ParameterForm(props: ParameterFormProps) {
  const {
    age, setAge,
    withdrawalStartAge, setWithdrawalStartAge,
    withdrawalYear, setWithdrawalYear,
    initialCorpus, setInitialCorpus,
    equityAllocation, setEquityAllocation,
    realEstateAllocation, setRealEstateAllocation,
    passiveAllocation, setPassiveAllocation,
    debtAllocation, setDebtAllocation,
    altAllocation, setAltAllocation,
    simulationType, setSimulationType,
  } = props;

  const totalAllocation = equityAllocation + realEstateAllocation + passiveAllocation + debtAllocation + altAllocation;
  const allocationValid = Math.abs(totalAllocation - 1.0) < 0.0001;
  const years = 91 - age;

  const allocations = [
    { label: 'Equity', value: equityAllocation, setter: setEquityAllocation, color: 'var(--color-accent-blue)', tooltip: 'Stocks, mutual funds, ETFs' },
    { label: 'Real Estate', value: realEstateAllocation, setter: setRealEstateAllocation, color: 'var(--color-accent-emerald)', tooltip: 'Property investments' },
    { label: 'Commodity', value: passiveAllocation, setter: setPassiveAllocation, color: 'var(--color-accent-purple)', tooltip: 'Gold, silver, agricultural assets' },
    { label: 'Debt', value: debtAllocation, setter: setDebtAllocation, color: 'var(--color-accent-amber)', tooltip: 'Bonds, fixed deposits' },
    { label: 'Alternative', value: altAllocation, setter: setAltAllocation, color: 'var(--color-accent-cyan)', tooltip: 'Gold, commodities, crypto' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Left Column - User Parameters */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.25rem' }}>User Parameters</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Configure your retirement scenario</p>
        </div>



        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="input-label">Current Age</label>
            <input
              type="number"
              className="input-field"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              min={18}
              max={90}
            />
          </div>
          <div>
            <label className="input-label">Withdrawal Start Age</label>
            <input
              type="number"
              className="input-field"
              value={withdrawalStartAge}
              onChange={(e) => setWithdrawalStartAge(e.target.value === '' ? '' : Number(e.target.value))}
              min={18}
              max={90}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="input-label">Withdrawal Year</label>
          <input
            type="number"
            className="input-field"
            value={withdrawalYear}
            disabled
            style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)', cursor: 'not-allowed', width: '100%' }}
          />
        </div>



        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(79,143,255,0.06)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(79,143,255,0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Target age</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>90</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Simulations</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>10,000</span>
          </div>
        </div>
      </div>

      {/* Right Column - Asset Allocation */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="input-label">Initial Corpus</label>
          <input
            type="number"
            className="input-field"
            value={initialCorpus}
            onChange={(e) => setInitialCorpus(e.target.value === '' ? '' : Number(e.target.value))}
            min={0}
          />
          <p className="input-hint" style={{ color: 'var(--color-accent-blue)', fontWeight: 500 }}>
            {formatINR(initialCorpus)}
          </p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>Asset Allocation</h3>
            <span
              className={allocationValid ? 'badge badge-success' : 'badge badge-error'}
            >
              {(totalAllocation * 100).toFixed(1)}%
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Must sum to 100%
            {!allocationValid && (
              <span style={{ color: 'var(--color-accent-rose)', marginLeft: '0.5rem' }}>
                — off by {((totalAllocation - 1) * 100).toFixed(1)}%
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {allocations.map((a) => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: a.color,
                    flexShrink: 0,
                  }}
                />
                <label
                  className="input-label"
                  style={{ margin: 0, minWidth: 110, color: 'var(--color-text-secondary)' }}
                  title={a.tooltip}
                >
                  {a.label}
                </label>
                <input
                  type="number"
                  className="input-field"
                  style={{ width: 90, textAlign: 'center', padding: '0.375rem 0.5rem', fontSize: '0.875rem' }}
                  value={a.value === '' ? '' : Number((Number(a.value) * 100).toFixed(4))}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      a.setter('');
                    } else {
                      const val = parseFloat(e.target.value);
                      a.setter(isNaN(val) ? '' : val / 100);
                    }
                  }}
                  step={0.1}
                  min={0}
                  max={100}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', minWidth: 20 }}>
                  %
                </span>
              </div>
            ))}
          </div>

          {/* Allocation pie visualization */}
          <div style={{ height: 160, width: 160, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocations.filter(a => a.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={16}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {allocations.filter(a => a.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Allocation']}
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
