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
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  // Parámetros del canal (igual lógica que 5G)
  const alpha = 80; // Atenuación exponencial (ajustable)
  const fadingFrequency = 20; // Fading lento para que se visualice

  const { txData, rxData } = useMemo(() => {
    const fc = frequency;
    const fm = audioFrequency;
    const deltaF = frequencyDeviation;

    const beta = deltaF / fm; // Índice de modulación FM

    const sampleRate = 1e5;
    const visualWindow = 0.01; // 10 ms
    const totalSamples = Math.floor(sampleRate * visualWindow);

    const amplitude = Math.sqrt(power || 1);

    const tx: { x: number; y: number }[] = [];
    const rx: { x: number; y: number }[] = [];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      // Señal FM pura
      const signal =
        amplitude *
        Math.cos(2 * Math.PI * fc * t + beta * Math.sin(2 * Math.PI * fm * t));

      // Atenuación exponencial
      const attenuation = Math.exp(-alpha * t);

      // Fading multiplicativo
      const fading = 0.7 + 0.3 * Math.cos(2 * Math.PI * fadingFrequency * t);

      const channelGain = attenuation * fading;

      tx.push({ x: t, y: signal });
      rx.push({ x: t, y: signal * channelGain });
    }

    return { txData: tx, rxData: rx };
  }, [frequency, frequencyDeviation, audioFrequency, power]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: "Señal FM Transmitida (TX)",
          data: txData,
          borderWidth: 1,
          pointRadius: 0,
          borderColor: "rgba(120,120,120,0.2)",
          tension: 0,
        },
        {
          label: "Señal FM Recibida (RX - Con pérdida)",
          data: rxData,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
        },
      ],
    }),
    [txData, rxData],
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
          title: {
            display: true,
            text: "Tiempo (s)",
            font: { weight: "bold" },
          },
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
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
          title: {
            display: true,
            text: "Amplitud",
            font: { weight: "bold" },
          },
          grid: {
            color: "rgba(0,0,0,0.05)",
          },
          ticks: {
            callback: (value) => {
              const num = Number(value);
              return num === 0 ? "0" : num.toExponential(2);
            },
          },
        },
      },

      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            font: {
              size: 12,
              weight: "bold",
            },
          },
        },

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
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0,0,0,0.85)",
          titleFont: { weight: "bold" },
          callbacks: {
            label: (ctx) => {
              const y = ctx.parsed?.y;
              const yStr = typeof y === "number" ? y.toExponential(4) : "0";
              return `${ctx.dataset.label}: ${yStr}`;
            },
            title: (items) => {
              const x = items[0]?.parsed?.x;
              const xStr = typeof x === "number" ? x.toExponential(4) : "0";
              return `Tiempo: ${xStr} s`;
            },
          },
        },
      },
    }),
    [],
  );

  return <Line ref={chartRef} data={chartData} options={options} />;
};

export default MxSignalVisualization;
