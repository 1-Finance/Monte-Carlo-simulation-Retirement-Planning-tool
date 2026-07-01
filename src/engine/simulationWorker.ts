/**
 * Web Worker for running Monte Carlo simulation off the main thread
 */
import { runMonteCarloSimulation, type SimulationParams } from './simulation';

export type WorkerMessage =
  | { type: 'start'; params: SimulationParams }
  | { type: 'cancel' };

export type WorkerResponse =
  | { type: 'progress'; current: number; total: number; percentage: number }
  | { type: 'complete'; results: ReturnType<typeof runMonteCarloSimulation> }
  | { type: 'error'; message: string };

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'start') {
    try {
      const output = runMonteCarloSimulation(msg.params, (current, total) => {
        const response: WorkerResponse = {
          type: 'progress',
          current,
          total,
          percentage: Math.round((current / total) * 100 * 100) / 100,
        };
        self.postMessage(response);
      });

      const response: WorkerResponse = {
        type: 'complete',
        results: output,
      };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown simulation error',
      };
      self.postMessage(response);
    }
  }
};
