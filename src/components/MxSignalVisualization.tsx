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

interface SignalVisualizationProps {
  frequency: number; // fc
  frequencyDeviation: number; // Δf
  audioFrequency: number; // fm
  power: number;
}

const MxSignalVisualization: React.FC<SignalVisualizationProps> = ({
  frequency,
  frequencyDeviation,
  audioFrequency,
  power,
}) => {
  const { dataset } = useMemo(() => {
    const fc = frequency;
    const fm = audioFrequency;
    const deltaF = frequencyDeviation;
    const beta = deltaF / fm;
    const sampleRate = 1e5;
    const visualWindow = 0.01; // 10 ms

    const amplitude = Math.sqrt(power || 1);

    const totalSamples = Math.floor(sampleRate * visualWindow);

    const data: { x: number; y: number }[] = [];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      const signal =
        amplitude *
        Math.cos(2 * Math.PI * fc * t + beta * Math.sin(2 * Math.PI * fm * t));

      data.push({ x: t, y: signal });
    }

    return { dataset: data };
  }, [frequency, frequencyDeviation, audioFrequency, power]);

  const chartData = useMemo(() => {
    return {
      datasets: [
        {
          label: "Señal FM",
          data: dataset,
          borderWidth: 1.2,
          pointRadius: 0,
          borderColor: "#4682B4",
          tension: 0,
        },
      ],
    };
  }, [dataset]);

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

  const chartRef = useRef<ChartJS<"line"> | null>(null);

  return <Line ref={chartRef} data={chartData} options={options} />;
};

export default MxSignalVisualization;
