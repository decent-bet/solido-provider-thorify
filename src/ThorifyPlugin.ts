// eslint-disable-next-line spaced-comment
import Web3 from 'web3';
import {
  IMethodOrEventCall,
  EventFilter,
  ThorifyLog,
  SolidoProviderType,
  ProviderInstance
} from '@decent-bet/solido';
import { ThorifySigner } from './ThorifySigner';
import { ThorifySettings } from './ThorifySettings';
import { SolidoProvider } from '@decent-bet/solido';
import { SolidoContract, SolidoSigner } from '@decent-bet/solido';
import { SolidoTopic } from '@decent-bet/solido';
import { Observable, Subject, from } from 'rxjs';
import { pluck } from 'rxjs/operators';

export interface MapAction {
  [key: string]: {
    getter: string,
    onFilter: string,
    mutation: (e: object, contract: any) => Observable<object>
  };
}

export interface ReactiveContractStore {
  mapActions?: MapAction,
  state: object;
}


/**
 * ThorifyPlugin provider for Solido
 */
export class ThorifyPlugin extends SolidoProvider implements SolidoContract {
  private thor: Web3;
  public chainTag: string;
  private instance: any;
  public defaultAccount: string;
  public address: string;
  private privateKey: string;
  private store: ReactiveContractStore = {
    mapActions: {},
    state: {}
  };
  private _subscriber: Subject<object>;

  get from() {
    return this.defaultAccount;
  }

  public getProviderType(): SolidoProviderType {
    return SolidoProviderType.Thorify;
  }

  onReady<T>(settings: T & ThorifySettings) {
    const { store, privateKey, thor, chainTag, from } = settings;
    this.privateKey = privateKey;
    this.thor = thor;
    this.chainTag = chainTag;
    this.defaultAccount = from;
    this.store = store;
    this.connect();
  }

  public connect() {
    if (this.thor && this.chainTag && this.defaultAccount) {
      this.instance = new this.thor.eth.Contract(
        this.contractImport.raw.abi as any,
        this.contractImport.address[this.chainTag]
      );
      this.address = this.contractImport.address[this.chainTag];
      if (this.privateKey) {
        this.thor.eth.accounts.wallet.add(this.privateKey);
      }
      if (this.store) {
        this._subscriber = new Subject();
        this._subscriber.subscribe((state) => {
          this.store.state = state;
        });
        const allEvents$ = from(this.instance.getPastEvents());
        allEvents$.subscribe(async (i: any) => {
          console.log(i)
          const actions = this.store.mapActions;
          // find by event
          const found = Object.keys(actions).find(key => actions[key].onFilter === i.event);
          const x = actions[found];
          const mutateRes = await x.mutation(
            { ...i.returnValues },
            this.instance,
          )
          this._subscriber.next({
            ...this.store.state,
            [x.getter]: mutateRes,
          })
        })
      }
    } else {
      throw new Error('Missing onReady settings');
    }
  }

  subscribe(key: string, fn: any) {
    return this._subscriber.pipe(pluck(key)).subscribe(fn);
  }


  public setInstanceOptions(settings: ProviderInstance) {
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
    if (settings.options.store) {
      this.store = settings.options.store;
    }
  }

  async prepareSigning(
    methodCall: any,
    options: IMethodOrEventCall,
    args: any[]
  ): Promise<SolidoSigner> {
    let gas = options.gas;
    let gasPriceCoef = options.gasPriceCoef;

    if (!options.gasPriceCoef) gasPriceCoef = 0;
    if (!options.gas) gas = 1000000;

    // get method instance with args
    const fn = methodCall(...args);

    return new ThorifySigner(this.thor, fn, this.defaultAccount, {
      gas,
      gasPriceCoef
    });
  }

  getAbiMethod(name: string): object {
    return this.abi.filter(i => i.name === name)[0];
  }

  callMethod(name: string, args: any[]): any {
    let addr;
    addr = this.contractImport.address[this.chainTag];
    return this.instance.methods[name](...args).call({
      from: addr
    });
  }
  /**
   * Gets a Thorify Method object
   * @param name method name
   */
  getMethod(name: string): any {
    return this.instance.methods[name];
  }

  /**
   * Gets a Connex Event object
   * @param address contract address
   * @param eventAbi event ABI
   */
  getEvent(name: string): any {
    return this.instance.events[name];
  }

  public async getEvents<P, T>(
    name: string,
    eventFilter?: EventFilter<T & any>
  ): Promise<(P & ThorifyLog)[]> {
    const options: any = {};
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
        options.topics = (topics as SolidoTopic).get();
      }

      options.order = order || 'desc';

      if (pageOptions) {
        options.options = pageOptions;
      }
    }

    return await this.instance.getPastEvents(name, options);
  }
}
