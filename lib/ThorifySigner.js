"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThorifySigner = void 0;
const thor_devkit_1 = require("thor-devkit");
const THOR_QL = 'https://xdvmessaging.auth2factor.com/thorql/graphql';
class ThorifySigner {
    constructor(thor, fn, from, options, wallet) {
        this.thor = thor;
        this.fn = fn;
        this.from = from;
        this.wallet = wallet;
        this.gas = 0;
        this.gasPriceCoef = 0;
        this.gas = options.gas;
        this.gasPriceCoef = options.gasPriceCoef;
        this.contractAddress = options.contractAddress;
    }
    canUse() {
        return __awaiter(this, void 0, void 0, function* () {
            let ticket = null;
            const init = this.accepted;
            return new Promise((resolve) => {
                resolve(true);
            });
        });
    }
    requestSigning() {
        return __awaiter(this, void 0, void 0, function* () {
            const encodedPayload = this.fn.encodeABI();
            this.wallet.onRequestPassphraseSubscriber.next({
                type: 'request_tx',
                payload: encodedPayload,
            });
            const canUseIt = yield this.canUse();
            if (canUseIt) {
                let blockRef = yield this.thor.eth.getBlockRef();
                let chainTag = yield this.thor.eth.getChainTag();
                let body = {
                    chainTag: chainTag,
                    blockRef: blockRef,
                    expiration: 64,
                    clauses: [{
                            to: this.contractAddress,
                            data: encodedPayload,
                            value: 0,
                        }],
                    gasPriceCoef: 128,
                    gas: this.gas,
                    dependsOn: null,
                    nonce: new Date().getTime(),
                };
                let tx = new thor_devkit_1.Transaction(body);
                let signingHash = thor_devkit_1.cry.blake2b256(tx.encode());
                const privateKey = thor_devkit_1.cry.mnemonic.derivePrivateKey(this.wallet.mnemonic.split(' '));
                tx.signature = thor_devkit_1.cry.secp256k1.sign(signingHash, privateKey);
                let raw = tx.encode();
                return yield this.thor.eth.sendSignedTransaction('0x' + raw.toString('hex'));
            }
            else {
                return Promise.reject({ rejected: true });
            }
        });
    }
}
exports.ThorifySigner = ThorifySigner;
