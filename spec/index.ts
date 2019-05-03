import { SolidoModule } from '@decent-bet/solido';
import { ThorifyPlugin } from '../src';
import { EnergyTokenContract, EnergyContractImport } from './EnergyContract';
// Create Solido Module
export const module = new SolidoModule([
    {
        name: 'ConnexToken',
        import: EnergyContractImport,
        entity: EnergyTokenContract,
    },
    {
        name: 'ThorifyToken',
        import: EnergyContractImport,
        entity: EnergyTokenContract,
    }
], ThorifyPlugin);
