import { SolidoSigner } from '@decent-bet/solido';
import { Wallet } from 'xdvplatform-wallet';
export declare class ThorifySigner implements SolidoSigner {
    private thor;
    private fn;
    private from;
    private wallet;
    gas: number;
    gasPriceCoef: number;
    accepted: any;
    constructor(thor: any, fn: any, from: any, options: any, wallet: Wallet);
    canUse(): Promise<unknown>;
    requestSigning(): Promise<any>;
}
