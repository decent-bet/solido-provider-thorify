import { SolidoSigner } from '@decent-bet/solido';
import { Wallet } from 'xdvplatform-wallet';

export class ThorifySigner implements SolidoSigner {
    gas = 0;
    gasPriceCoef = 0;
    accepted: any;
    constructor(private thor: any, private fn, private from, options, private wallet: Wallet) {
        this.gas = options.gas;
        this.gasPriceCoef = options.gasPriceCoef;
    }


    public async canUse() {
        let ticket = null;
        const init = this.accepted;
        return new Promise((resolve) => {
            ticket = setInterval(() => {
                if (this.accepted !== init) {
                    clearInterval(ticket);
                    resolve(this.accepted);
                    this.accepted = undefined;
                    return;
                }
            }, 1000);
        });
    }
    
    async requestSigning(): Promise<any> {

        const encodedPayload = this.fn.encodeABI();
        this.wallet.onRequestPassphraseSubscriber.next({
            type: 'request_tx',
            payload: encodedPayload,
        });

        const canUseIt = await this.canUse();

        if (canUseIt) {
            return await this.fn.send({ from: this.from, gas: this.gas, gasPriceCoef: this.gasPriceCoef });
        } else {
            return Promise.reject({ rejected: true })
        }
    }
}
