import { STEPS, type StepName } from "./types";

export const INSTALL_STEP = "install_app" satisfies StepName;

export function shouldSkipInstallStep(isStandalone: boolean, stepName: StepName): boolean {
  return isStandalone && stepName === INSTALL_STEP;
}

export { STEPS };
