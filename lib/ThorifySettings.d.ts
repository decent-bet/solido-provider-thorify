import Web3 from 'web3';
import { Wallet } from 'xdvplatform-wallet';
export declare class ThorifySettings {
    privateKey: string;
    thor: Web3;
    chainTag: string;
    from: string;
    wallet: Wallet;
}
