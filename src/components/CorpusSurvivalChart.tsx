import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceDot, Label
} from 'recharts';
import { Download } from 'lucide-react';
import type { ChartData } from '../engine/chartCalculations';

function formatDynamicINR(valLakhs: number): string {
  if (!valLakhs && valLakhs !== 0) return '';
  const value = valLakhs * 100000;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface CorpusSurvivalChartProps {
  chartData: ChartData;
  currentAge: number;
  withdrawalAmount?: number;
  withdrawalYear?: number;
  withdrawalStartAge?: number;
}

export function CorpusSurvivalChart({ chartData, currentAge, withdrawalAmount = 3, withdrawalYear = 2034, withdrawalStartAge = 57 }: CorpusSurvivalChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    if (containerRef.current) {
      setChartWidth(containerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const xTicks = useMemo(() => {
    const ticks = [];
    for (let i = currentAge; i <= 90; i += 2) {
      ticks.push(i);
    }
    return ticks;
  }, [currentAge]);

  const yTicks = useMemo(() => {
    let maxVal = 0;
    if (chartData.percentile80) {
      chartData.percentile80.forEach((d) => {
        if (d.corpusValue > maxVal) maxVal = d.corpusValue;
      });
    }
    if (chartData.sampleSimulations) {
      chartData.sampleSimulations.forEach((sim) => {
        sim.data.forEach((d) => {
          if (d.corpusValue > maxVal) maxVal = d.corpusValue;
        });
      });
    }
    
    const step = 50000000; // 5 cr
    const maxTick = Math.ceil(maxVal / step) * step;
    
    const ticks = [];
    for (let i = 0; i <= maxTick; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [chartData]);

  const survivalMessage = chartData.survivesPast90
    ? '80% probability of corpus survival post age of 90'
    : `80% probability of corpus survival till age ${chartData.survivalAge}`;

  const yAxisWidth = useMemo(() => {
    const maxTickValue = yTicks.length > 0 ? yTicks[yTicks.length - 1] : 0;
    const formattedMax = `₹${(maxTickValue / 10000000).toFixed(1)} cr`;
    // ~8px per character + 30px for the rotated label and padding
    return Math.max(80, formattedMax.length * 8 + 30);
  }, [yTicks]);

  const calloutAge = chartData.survivesPast90 ? 90 : chartData.survivalAge;
  const corpusAtCalloutObj = chartData.percentile80.find(d => d.year === calloutAge);
  const corpusValueAtCallout = corpusAtCalloutObj ? corpusAtCalloutObj.corpusValue : 0;

  const renderCallout = (props: any) => {
    const { viewBox } = props;
    const { x, y } = viewBox;
    const val = Math.round(corpusValueAtCallout / 10000000);
    const text = `${calloutAge}, ${val === 0 ? '0' : '₹' + val}`;
    const boxWidth = 60;
    const boxHeight = 26;
    
    return (
      <g style={{ pointerEvents: 'none' }}>
        <polygon points={`${x - 10},${y + 25} ${x},${y + 25} ${x},${y}`} fill="#000" />
        <rect x={x - boxWidth + 6} y={y + 25} width={boxWidth} height={boxHeight} fill="#000" rx={3} />
        <text x={x - boxWidth / 2 + 6} y={y + 42} fill="#fff" textAnchor="middle" fontSize={12} fontWeight="bold">
          {text}
        </text>
      </g>
    );
  };

  const downloadChart = async () => {
    if (!chartRef.current) return;
    try {
      const domtoimage = await import('dom-to-image-more');
      const dataUrl = await (domtoimage as any).toPng(chartRef.current, {
        quality: 1,
        bgcolor: '#ffffff',
        scale: 2,
        style: { backgroundColor: '#ffffff', border: 'none', outline: 'none', boxShadow: 'none', margin: 0, padding: '1.5rem' },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `retirement-corpus-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error('Failed to download chart:', error);
    }
  };

  return (
    <div className="glass-card-static animate-slide-up" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>Corpus Survival Probability</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            80th percentile (black) with {chartData.sampleSimulations.length} sample scenarios (orange)
          </p>
        </div>
        <button className="btn-secondary" onClick={downloadChart}>
          <Download size={16} />
          Download PNG
        </button>
      </div>

      <div ref={chartRef} className="chart-export-area" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem', backgroundColor: '#fff', border: 'none', outline: 'none', boxShadow: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', border: 'none', outline: 'none', background: 'transparent' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000', margin: '0 0 0.5rem 0', lineHeight: 1.4, border: 'none', outline: 'none', background: 'transparent' }}>
            Retirement Corpus with {formatDynamicINR(withdrawalAmount)} withdrawal/month starting from {withdrawalYear}
          </h2>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#000', margin: 0, lineHeight: 1.4, border: 'none', outline: 'none', background: 'transparent' }}>
            (Age={withdrawalStartAge})
          </h2>
        </div>
        <div ref={containerRef} style={{ height: 380, width: '100%', outline: 'none', border: 'none' }}>
            <LineChart width={chartWidth} height={380} margin={{ left: yAxisWidth, right: 16, top: 10, bottom: 55 }}>
              <XAxis
                dataKey="year"
                type="number"
                domain={[currentAge, 90]}
                ticks={xTicks}
                interval={0}
                label={{ value: 'Age →', position: 'insideBottom', offset: -5, style: { fontWeight: 'bold', fontSize: 13, fill: '#333' } }}
                tick={{ fontSize: 12, fill: '#555' }}
              />
              <YAxis
                width={yAxisWidth}
                ticks={yTicks}
                domain={[0, yTicks.length > 0 ? yTicks[yTicks.length - 1] : 'auto']}
                label={{ value: 'Retirement Corpus →', angle: -90, position: 'left', offset: 10, style: { fontWeight: 'bold', fontSize: 13, fill: '#333', textAnchor: 'middle' } }}
                tickFormatter={(value: number) => `₹${(value / 10000000).toFixed(1)}\u00A0cr`}
                tick={{ fontSize: 11, fill: '#555' }}
              />
              <Tooltip
                formatter={(value: number) => [`₹${(value / 10000000).toFixed(2)} cr`, 'Corpus']}
                labelFormatter={(label: number) => `Age: ${label}`}
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}
              />

              {/* Sample simulation lines in orange */}
              {chartData.sampleSimulations.map((sim) => (
                <Line
                  key={`sim-${sim.simulationNumber}`}
                  data={sim.data}
                  type="monotone"
                  dataKey="corpusValue"
                  stroke="#E59866"
                  strokeWidth={1}
                  opacity={0.6}
                  dot={false}
                  legendType="none"
                  name={undefined}
                />
              ))}

              {/* 80th percentile line in black */}
              <Line
                data={chartData.percentile80}
                type="monotone"
                dataKey="corpusValue"
                stroke="#000000"
                strokeWidth={3.5}
                dot={false}
                name={survivalMessage}
              />
              {/* Callout at dynamic age */}
              {corpusAtCalloutObj && (
                <ReferenceDot x={calloutAge} y={corpusValueAtCallout} r={0} stroke="none">
                  <Label content={renderCallout} />
                </ReferenceDot>
              )}
            </LineChart>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingLeft: yAxisWidth, paddingRight: 16, border: 'none', outline: 'none', background: 'transparent' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#222', whiteSpace: 'nowrap', border: 'none', outline: 'none', background: 'transparent' }}>
            {survivalMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
