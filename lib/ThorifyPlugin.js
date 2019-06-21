"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const solido_1 = require("@decent-bet/solido");
const ThorifySigner_1 = require("./ThorifySigner");
const solido_2 = require("@decent-bet/solido");
class ThorifyPlugin extends solido_2.SolidoProvider {
    get from() {
        return this.defaultAccount;
    }
    getProviderType() {
        return solido_1.SolidoProviderType.Thorify;
    }
    onReady(settings) {
        const { privateKey, thor, chainTag, from } = settings;
        this.privateKey = privateKey;
        this.thor = thor;
        this.chainTag = chainTag;
        this.defaultAccount = from;
        this.connect();
    }
    connect() {
        if (this.thor && this.chainTag && this.defaultAccount) {
            this.instance = new this.thor.eth.Contract(this.contractImport.raw.abi, this.contractImport.address[this.chainTag]);
            this.address = this.contractImport.address[this.chainTag];
            if (this.privateKey) {
                this.thor.eth.accounts.wallet.add(this.privateKey);
            }
        }
        else {
            throw new Error('Missing onReady settings');
        }
    }
    setInstanceOptions(settings) {
        this.thor = settings.provider;
        if (settings.options.chainTag) {
            this.chainTag = settings.options.chainTag;
        }
        if (settings.options.defaultAccount) {
            this.defaultAccount = settings.options.defaultAccount;
        }
        if (settings.options.privateKey) {
            this.privateKey = settings.options.privateKey;
        }
    }
    prepareSigning(methodCall, options, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let gas = options.gas;
            let gasPriceCoef = options.gasPriceCoef;
            if (!options.gasPriceCoef)
                gasPriceCoef = 0;
            if (!options.gas)
                gas = 1000000;
            const fn = methodCall(...args);
            return new ThorifySigner_1.ThorifySigner(this.thor, fn, this.defaultAccount, {
                gas,
                gasPriceCoef
            });
        });
    }
    getAbiMethod(name) {
        return this.abi.filter(i => i.name === name)[0];
    }
    callMethod(name, args) {
        let addr;
        addr = this.contractImport.address[this.chainTag];
        return this.instance.methods[name](...args).call({
            from: addr
        });
    }
    getMethod(name) {
        return this.instance.methods[name];
    }
    getEvent(name) {
        return this.instance.events[name];
    }
    getEvents(name, eventFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {};
            if (eventFilter) {
                const { range, filter, topics, order, pageOptions, blocks } = eventFilter;
                if (filter) {
                    options.filter = filter;
                }
                if (blocks) {
                    const { fromBlock, toBlock } = blocks;
                    options.toBlock = toBlock;
                    options.fromBlock = fromBlock;
                }
                if (range) {
                    options.range = range;
                }
                if (topics) {
                    options.topics = topics.get();
                }
                options.order = order || 'desc';
                if (pageOptions) {
                    options.options = pageOptions;
                }
            }
            return yield this.instance.getPastEvents(name, options);
        });
    }
}
exports.ThorifyPlugin = ThorifyPlugin;
