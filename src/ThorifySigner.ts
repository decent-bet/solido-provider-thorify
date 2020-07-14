import { cry, Transaction } from 'thor-devkit';
import { SolidoSigner } from '@decent-bet/solido';
import { Wallet } from 'xdvplatform-wallet';

const THOR_QL = 'https://xdvmessaging.auth2factor.com/thorql/graphql';

export class ThorifySigner implements SolidoSigner {
    gas = 0;
    gasPriceCoef = 0;
    accepted: any;
    contractAddress: any;
    constructor(private thor: any, private fn, private from, options, private wallet: Wallet) {
        this.gas = options.gas;
        this.gasPriceCoef = options.gasPriceCoef;
        this.contractAddress = options.contractAddress;
    }


    public async canUse() {
        let ticket = null;
        const init = this.accepted;
        return new Promise((resolve) => {
            resolve(true);
            // ticket = setInterval(() => {
            //     if (this.accepted !== init) {
            //         clearInterval(ticket);
            //         resolve(this.accepted);
            //         this.accepted = undefined;
            //         return;
            //     }
            // }, 1000);
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
            let blockRef = await this.thor.eth.getBlockRef();
            let chainTag = await this.thor.eth.getChainTag();
            let body = {
                chainTag: chainTag,
                blockRef: blockRef,
                expiration: 32,
                clauses: [{
                    to: this.contractAddress,
                    data: encodedPayload,
                    value: 0,
                }],
                gasPriceCoef: this.gasPriceCoef,
                gas: this.gas,
                dependsOn: null,
                nonce: new Date().getTime(),
            }
            let tx = new Transaction(body);
            let signingHash = cry.blake2b256(tx.encode());
            const privateKey = cry.mnemonic.derivePrivateKey(this.wallet.mnemonic.split(' '));
            tx.signature = cry.secp256k1.sign(signingHash, privateKey);
            let raw = tx.encode();


            const r = await fetch(THOR_QL, {
                "headers": {
                    "accept": "application/json",
                    "content-type": "application/json",
                },
                "body": "{\"query\":\"mutation run {\\n  sendRawTransaction(data: \\\""
                    + '0x'+raw.toString('hex') + "\\\")\\n}\\n\",\"variables\":null,\"operationName\":\"run\"}",
                "method": "POST",
                "mode": "cors"
            });
            const resp = await r.json();
            return resp.data.sendRawTransaction;
            // return await this.thor.eth.sendSignedTransaction(‘0x’+raw.toString(‘hex’));
            // return yield this.fn.send({ from: this.from, gas: this.gas, gasPriceCoef: this.gasPriceCoef });
        }
        else {
            return Promise.reject({ rejected: true });
        }



    }
}
