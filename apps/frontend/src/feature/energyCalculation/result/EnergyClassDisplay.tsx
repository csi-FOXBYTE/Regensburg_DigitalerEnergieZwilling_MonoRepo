import { useStore } from '@nanostores/react';
import { Trans } from 'react-i18next';
import { Paper } from '../../../components/ui/paper';
import { $currentEnergyState } from '../../../lib/state/computed/current-energy-state';
import { $renovatedEnergyState } from '../../../lib/state/computed/renovated-energy-state';
import EnergyClassBars from './EnergyClassBars';

export default function EnergyClassDisplay() {
  const current = useStore($currentEnergyState);
  const renovated = useStore($renovatedEnergyState);

  const unchanged = current.energyEfficiencyClass === renovated.energyEfficiencyClass;

  return (
    <Paper className="flex flex-col gap-3 p-3">
      <div>
        {unchanged ? (
          <Trans
            ns="energyCalculation"
            i18nKey="result.energyClassUnchanged"
            values={{ class: current.energyEfficiencyClass }}
            components={{ bold: <strong /> }}
          />
        ) : (
          <Trans
            ns="energyCalculation"
            i18nKey="result.energyClassImprovement"
            values={{ from: current.energyEfficiencyClass, to: renovated.energyEfficiencyClass }}
            components={{ bold: <strong /> }}
          />
        )}
      </div>
      <EnergyClassBars />
    </Paper>
  );
}
