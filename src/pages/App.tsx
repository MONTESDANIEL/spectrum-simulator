import React, { useState } from "react";
import Dropdown from "../components/Dropdown";
import Input, { NumberInput } from "../components/Input";
import MxSignalVisualization from "../components/MxSignalVisualization";
import Sg5GSignalVisualization from "../components/SgSignalVisualization";

const unitMaps = {
  frequency: {
    Hz: 1,
    kHz: 1e3,
    MHz: 1e6,
    GHz: 1e9,
    THz: 1e12,
  },
  power: {
    mW: 1e-3,
    W: 1,
    kW: 1e3,
  },
} as const;

type UnitCategory = keyof typeof unitMaps;
type UnitOf<T extends UnitCategory> = Extract<
  keyof (typeof unitMaps)[T],
  string
>;

interface PhysicalInput<T extends UnitCategory> {
  value: number | null;
  unit: UnitOf<T>;
}

const toBase = <T extends UnitCategory>(
  input: PhysicalInput<T>,
  type: T,
): number | null => {
  if (input.value === null) return null;
  return input.value * (unitMaps[type][input.unit] as number);
};

type SignalParams =
  | {
      country: "mx";
      frequency: number;
      frequencyDeviation: number;
      audioFrequency: number;
      power: number;
    }
  | {
      country: "sg";
      frequency: number;
      subcarrierSpacing: number;
      numSubcarriers: number;
      power: number;
    };

const App: React.FC = () => {
  const [errors, setErrors] = useState<{
    country?: string;
    frequency?: string;
    frequencyDeviation?: string;
    audioFrequency?: string;
    power?: string;
  }>({});

  const [country, setCountry] = useState("");

  const [frequency, setFrequency] = useState<PhysicalInput<"frequency">>({
    value: null,
    unit: "Hz",
  });

  const [power, setPower] = useState<PhysicalInput<"power">>({
    value: null,
    unit: "W",
  });

  const [audioFrequency, setAudioFrequency] = useState<
    PhysicalInput<"frequency">
  >({
    value: null,
    unit: "Hz",
  });

  const [frequencyDeviation, setFrequencyDeviation] = useState<
    PhysicalInput<"frequency">
  >({
    value: null,
    unit: "Hz",
  });

  const [subcarrierSpacing, setSubcarrierSpacing] = useState<
    PhysicalInput<"frequency">
  >({
    value: null,
    unit: "Hz",
  });

  const [numSubcarriers, setNumSubcarriers] = useState<number | null>(null);

  const [showGraph, setShowGraph] = useState(false);

  const countryOptions = [
    { value: "mx", label: "México - Radiodifusión FM" },
    { value: "sg", label: "Singapur - 5G Sub-6 GHz" },
  ];

  const [signalParams, setSignalParams] = useState<SignalParams | null>(null);

  const handleValidate = () => {
    const fc = toBase(frequency, "frequency");
    const deltaF = toBase(frequencyDeviation, "frequency");
    const fm = toBase(audioFrequency, "frequency");
    const p = toBase(power, "power");

    const newErrors: typeof errors = {};

    if (!country) {
      newErrors.country = "Selección obligatoria";
    }

    if (country === "mx") {
      if (!fc) {
        newErrors.frequency = "Frecuencia obligatoria.";
      } else if (fc < 88e6 || fc > 108e6) {
        newErrors.frequency = "Debe estar entre 88 y 108 MHz.";
      }

      if (!deltaF) {
        newErrors.frequencyDeviation = "Desviación obligatoria.";
      } else if (deltaF <= 0 || deltaF > 75e3) {
        newErrors.frequencyDeviation = "Máximo permitido: 75 kHz.";
      }

      if (!fm) {
        newErrors.audioFrequency = "Frecuencia de audio obligatoria.";
      } else if (fm <= 0 || fm > 15e3) {
        newErrors.audioFrequency = "Debe estar entre 0 y 15 kHz.";
      }

      if (!p) {
        newErrors.power = "Potencia obligatoria.";
      } else if (p <= 0) {
        newErrors.power = "Debe ser mayor que 0.";
      }

      // Regla de Carson
      if (deltaF && fm) {
        const bandwidth = 2 * (deltaF + fm);
        if (bandwidth > 200e3) {
          newErrors.frequencyDeviation = "El ancho de banda excede 200 kHz.";
        }
      }

      setSignalParams({
        country: "mx",
        frequency: fc!,
        frequencyDeviation: deltaF!,
        audioFrequency: fm!,
        power: p!,
      });
    }

    if (country === "sg") {
      if (!fc) {
        newErrors.frequency = "Frecuencia obligatoria.";
      } else if (fc < 3.3e9 || fc > 3.8e9) {
        newErrors.frequency = "Debe estar entre 3.3 y 3.8 GHz.";
      }

      if (!subcarrierSpacing.value) {
        newErrors.frequencyDeviation =
          "Separación de subportadoras obligatoria.";
      } else if (
        subcarrierSpacing.value <= 0 ||
        subcarrierSpacing.value > 120e3
      ) {
        newErrors.frequencyDeviation = "Separación máxima: 120 kHz.";
      }

      if (!numSubcarriers) {
        newErrors.audioFrequency = "Número de subportadoras obligatorio.";
      } else if (numSubcarriers <= 0 || numSubcarriers > 4096) {
        newErrors.audioFrequency = "Número máximo: 4096 subportadoras.";
      }

      if (!p) {
        newErrors.power = "Potencia obligatoria.";
      } else if (p <= 0) {
        newErrors.power = "Debe ser mayor que 0.";
      }

      setSignalParams({
        country: "sg",
        frequency: fc!,
        subcarrierSpacing: subcarrierSpacing.value!,
        numSubcarriers: numSubcarriers!,
        power: p!,
      });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setShowGraph(true);
  };

  const handleClear = () => {
    setShowGraph(false);
    setSignalParams(null);
  };

  return (
    <main className="bg-gray-50">
      <section className="mx-auto flex min-h-screen flex-col justify-center gap-5 p-5 lg:container">
        <section className="rounded-2xl bg-white p-5 shadow">
          <h2 className="mb-6 text-center text-xl font-semibold">
            Configuración de la señal
          </h2>
          <div className="space-y-4">
            <Dropdown
              options={countryOptions}
              placeholder="País"
              value={country}
              error={errors.country}
              onChange={setCountry}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {country === "mx" ? (
                <>
                  <Input
                    value={frequency}
                    onChange={setFrequency}
                    placeholder="Frecuencia portadora"
                    unitType="frequency"
                    error={errors.frequency}
                  />
                  <Input
                    value={power}
                    onChange={setPower}
                    placeholder="Potencia"
                    unitType="power"
                    minValue={0}
                    error={errors.power}
                  />
                  <Input
                    value={audioFrequency}
                    onChange={setAudioFrequency}
                    placeholder="Frecuencia de audio"
                    unitType="frequency"
                    error={errors.audioFrequency}
                  />
                  <Input
                    value={frequencyDeviation}
                    onChange={setFrequencyDeviation}
                    placeholder="Desviación de frecuencia (Δf)"
                    unitType="frequency"
                    error={errors.frequencyDeviation}
                  />
                </>
              ) : country === "sg" ? (
                <>
                  <Input
                    value={frequency}
                    onChange={setFrequency}
                    placeholder="Frecuencia portadora"
                    unitType="frequency"
                    error={errors.frequency}
                  />
                  <Input
                    value={power}
                    onChange={setPower}
                    placeholder="Potencia"
                    unitType="power"
                    minValue={0}
                    error={errors.power}
                  />
                  <Input
                    value={subcarrierSpacing}
                    onChange={setSubcarrierSpacing}
                    placeholder="Separación de subportadoras (Δf)"
                    unitType="frequency"
                    error={errors.frequencyDeviation}
                  />
                  <NumberInput
                    value={numSubcarriers}
                    onChange={setNumSubcarriers}
                    placeholder="Número de subportadoras"
                    min={1}
                    max={4096}
                  />
                </>
              ) : null}
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <button
                onClick={handleClear}
                className="w-full cursor-pointer rounded-xl border border-gray-400 px-6 py-2 font-medium text-gray-400 transition-colors duration-200 hover:bg-gray-400 hover:text-white"
              >
                Limpiar
              </button>
              <button
                onClick={handleValidate}
                className="w-full cursor-pointer rounded-xl bg-indigo-500 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-indigo-600"
              >
                Generar señal
              </button>
            </div>
          </div>
        </section>
        {showGraph && signalParams && (
          <section className="flex flex-1 flex-col rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-6 text-center text-xl font-semibold">
              Visualización
            </h2>
            <div className="flex min-h-100 flex-1 items-center justify-center overflow-hidden rounded-xl">
              {signalParams.country === "mx" ? (
                <MxSignalVisualization
                  frequency={signalParams.frequency}
                  frequencyDeviation={signalParams.frequencyDeviation}
                  audioFrequency={signalParams.audioFrequency}
                  power={signalParams.power}
                />
              ) : (
                <Sg5GSignalVisualization
                  frequency={signalParams.frequency}
                  subcarrierSpacing={signalParams.subcarrierSpacing}
                  numSubcarriers={signalParams.numSubcarriers}
                  power={signalParams.power}
                />
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

export default App;
