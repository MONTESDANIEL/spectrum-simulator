import React, { useMemo, useRef } from "react";
import zoomPlugin from "chartjs-plugin-zoom";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  CategoryScale,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  CategoryScale,
  zoomPlugin,
);

interface Signal5GProps {
  frequency?: number;
  subcarrierSpacing?: number;
  numSubcarriers?: number;
  power?: number;
}

const Sg5GSignalVisualization: React.FC<Signal5GProps> = ({
  frequency = 3.5e9,
  subcarrierSpacing = 30e3,
  numSubcarriers = 32,
  power = 1,
}) => {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const symbols = useMemo(() => {
    return Array.from(
      { length: numSubcarriers },
      (_, k) => (k % 4) * (Math.PI / 2),
    );
  }, [numSubcarriers]);

  const dataset = useMemo(() => {
    const fc = frequency;
    const deltaF = subcarrierSpacing;
    const amplitude = Math.sqrt(power / numSubcarriers);
    const sampleRate = 20e9;
    const visualWindow = 1e-6;
    const totalSamples = Math.floor(sampleRate * visualWindow);

    const data: { x: number; y: number }[] = [];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let signal = 0;
      for (let k = 0; k < numSubcarriers; k++) {
        const freq = fc + k * deltaF;
        signal += amplitude * Math.cos(2 * Math.PI * freq * t + symbols[k]);
      }
      data.push({ x: t, y: signal });
    }
    return data;
  }, [frequency, subcarrierSpacing, numSubcarriers, power, symbols]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: "Señal 5G NR (OFDM)",
          data: dataset,
          borderWidth: 1.2,
          pointRadius: 0,
          borderColor: "#CD5C5C",
          tension: 0,
        },
      ],
    }),
    [dataset],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      normalized: true,
      scales: {
        x: {
          type: "linear",
          ticks: {
            autoSkip: true,
            maxTicksLimit: 6,
            callback: (value) => {
              const num = Number(value);
              return num === 0 ? "0" : num.toExponential(2);
            },
          },
        },
        y: {
          ticks: {
            callback: (value) => Number(value).toFixed(2),
          },
        },
      },
      plugins: {
        zoom: {
          limits: { x: { minRange: 1e-12 } },
          pan: { enabled: true, mode: "x" },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              // Comprobación de tipo robusta para evitar el error de "null"
              const y = ctx.parsed?.y;
              const yStr = typeof y === "number" ? y.toFixed(4) : "0.0000";
              return `Amplitud: ${yStr}`;
            },
            title: (items) => {
              // Comprobación de tipo robusta para el eje X
              const x = items[0]?.parsed?.x;
              const xStr = typeof x === "number" ? x.toExponential(4) : "0";
              return `Tiempo: ${xStr}s`;
            },
          },
        },
      },
    }),
    [],
  );

  return <Line ref={chartRef} data={chartData} options={options} />;
};

export default Sg5GSignalVisualization;
