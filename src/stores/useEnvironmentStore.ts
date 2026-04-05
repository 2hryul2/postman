import { create } from "zustand";
import type { Environment, EnvVariable } from "@/types";

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  variables: EnvVariable[];
  setEnvironments: (environments: Environment[]) => void;
  setActiveEnvironmentId: (id: string | null) => void;
  setVariables: (variables: EnvVariable[]) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  environments: [],
  activeEnvironmentId: null,
  variables: [],
  setEnvironments: (environments) => set({ environments }),
  setActiveEnvironmentId: (id) => set({ activeEnvironmentId: id }),
  setVariables: (variables) => set({ variables }),
}));
