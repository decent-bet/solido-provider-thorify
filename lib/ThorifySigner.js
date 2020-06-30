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
    }
    canUse() {
        return __awaiter(this, void 0, void 0, function* () {
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
                return yield this.fn.send({ from: this.from, gas: this.gas, gasPriceCoef: this.gasPriceCoef });
            }
            else {
                return Promise.reject({ rejected: true });
            }
        });
    }
}
exports.ThorifySigner = ThorifySigner;
