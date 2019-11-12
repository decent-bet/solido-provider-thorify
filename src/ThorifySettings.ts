import Web3 from 'web3'
import { ReactiveContractStore } from './ThorifyPlugin';

export class ThorifySettings {
    privateKey: string;
    thor: Web3;    
    chainTag: string;
    from: string;
    store?: ReactiveContractStore;
}