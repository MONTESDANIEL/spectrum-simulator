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
  frequency: number;
  subcarrierSpacing: number;
  numSubcarriers: number;
  power: number;
}

const Sg5GSignalVisualization: React.FC<Signal5GProps> = ({
  frequency,
  subcarrierSpacing,
  numSubcarriers,
  power,
}) => {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const alpha = 3e6; // coeficiente de atenuación (ajustable)
  const fadingFrequency = 2e6; // frecuencia de fading

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
    const visualWindow = 4e-6;
    const totalSamples = Math.floor(sampleRate * visualWindow);

    const txData: { x: number; y: number }[] = [];
    const rxData: { x: number; y: number }[] = [];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let signal = 0;

      for (let k = 0; k < numSubcarriers; k++) {
        const freq = fc + k * deltaF;
        signal += amplitude * Math.cos(2 * Math.PI * freq * t + symbols[k]);
      }

      // Atenuación exponencial
      const attenuation = Math.exp(-alpha * t);

      // Fading suave (multipath simplificado)
      const fading = 0.7 + 0.3 * Math.cos(2 * Math.PI * fadingFrequency * t);

      // Ganancia total del canal dependiente del tiempo
      const channelGain = attenuation * fading;

      const receivedSignal = channelGain * signal;

      txData.push({ x: t, y: signal });
      rxData.push({ x: t, y: receivedSignal });
    }

    return { txData, rxData };
  }, [frequency, subcarrierSpacing, numSubcarriers, power, symbols]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: "Señal Transmitida (TX)",
          data: dataset.txData,
          borderWidth: 1,
          pointRadius: 0,
          borderColor: "rgba(120,120,120,0.2)",
          tension: 0,
        },
        {
          label: "Señal Recibida (RX - Con pérdida)",
          data: dataset.rxData,
          borderWidth: 2,
          pointRadius: 0,
          borderColor: "rgba(40, 167, 69, 0.9)", // verde más fuerte
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
          backgroundColor: "rgba(0,0,0,0.8)",
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

export default Sg5GSignalVisualization;
