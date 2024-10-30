import * as FXConnectLite from '@gehtsoft/traduAPI-node';
import { program } from 'commander';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
const dotenv = require('dotenv');

dotenv.config();
console.log(process.env.API_USER_NAME);

export const options = program.opts();
let symbolMap: Map<string, FXConnectLite.Offer> = new Map();

// Assuming `getFormattedDate` is a function that returns a formatted date string
function getFormattedDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

const logDir = path.join(__dirname, '..', 'logs');
const logFileName: string = `app-${getFormattedDate()}.log`;
const logFilePath: string = path.join(logDir, logFileName);

// Ensure the 'log' directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Function to write to the log file
const writeLog = (message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;

  // Append log message to the file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

class ConnectionStatusChangeListener implements FXConnectLite.IConnectionStatusChangeListener {
  onConnectionStatusChange(status: FXConnectLite.IConnectionStatus) {
    writeLog('Connection status changed. ' + this.getStatusString(status));
  }

  getStatusString(status: FXConnectLite.IConnectionStatus): string {
    return (
      (status.isConnected() ? 'Connected' : '') +
      (status.isConnecting() ? 'Connecting' : '') +
      (status.isReconnecting() ? 'Reconnecting' : '') +
      (status.isDisconnected() ? 'Disconnected' : '')
    );
  }
}

class CompleteLoginConnectionStatusChangeListener implements FXConnectLite.IConnectionStatusChangeListener {
  private readonly completeLoginResolve: any;
  private readonly loginReject: any;
  private readonly session: any;

  constructor(completeLoginResolve: any, loginReject: any, session: any) {
    this.completeLoginResolve = completeLoginResolve;
    this.loginReject = loginReject;
    this.session = session;
  }

  onConnectionStatusChange(status: FXConnectLite.IConnectionStatus) {
    if (status.isConnected()) {
      this.session.unsubscribeConnectionStatusChange(this);
      this.completeLoginResolve();
    } else if (status.isDisconnected()) {
      this.session.unsubscribeConnectionStatusChange(this);
      this.loginReject();
    }
  }
}

class Printer {
  static print(message: string): void {
    console.log(message);
  }
}

class InstrumentFormatter {
  static readonly TITLE =
    `OfferId | Symbol | Currency | Digits | PointSize | Type | TradingStatus | Multiplier | SellInt |` +
    ` BuyInt | SubscriptionStatus | DividendSell | DividendBuy | hasDividendSell | hasDividendBuy | MinQuantity | OpenBuyComm |` +
    ` OpenSellComm | MMR | SortOrder | PriceStreamId | ConditionDistStop | ConditionDistLimit | ConditionDistEntryStop | ConditionDistEntryLimit| AskAdjustment | BidAdjustment | Fractional pip size`;

  public static format(
    instrument: FXConnectLite.Instrument,
    dividendsProvider: FXConnectLite.IDividendsProvider,
    account: FXConnectLite.Account,
    minQuantity: number,
    openBuyCommission: number,
    openSellCommission: number,
    mmr: number,
  ): string {
    let formatString;
    formatString =
      `${instrument.getOfferId()} | ${instrument.getSymbol()} | ${instrument.getContractCurrency()} | ` +
      `${instrument.getDigits()} | ${instrument.getPointSize()} | ${instrument.getInstrumentType()} | ` +
      `${instrument.getTradingStatus()} | ${instrument.getContractMultiplier()} | ${instrument.getSellInterest()} | ` +
      `${instrument.getBuyInterest()} | ${instrument.getSubscriptionStatus()} | ${instrument.getDividendSell()} | ` +
      `${instrument.getDividendBuy()} | ${instrument.hasDividendSell()} | ${instrument.hasDividendBuy()} | ` +
      `${minQuantity} | ${openBuyCommission} | ${openSellCommission} | ${mmr} | ${instrument.getSortOrder()} | ` +
      `${instrument.getPriceStreamId()} | ${instrument.getConditionDistStop()} | ${instrument.getConditionDistLimit()} | ${instrument.getConditionDistEntryStop()} | ` +
      `${instrument.getConditionDistEntryLimit()} | ${instrument.getAskAdjustment()} | ${instrument.getBidAdjustment()} | ${instrument.getFractionalPipSize()}`;

    return formatString;
  }
}

class OfferFormatter {
  static readonly TITLE = `OfferId | Symbol | Ask | Bid | High | Low | BidTradable | AskTradable | Volume | Time | PipCost`;

  public static format(
    offer: FXConnectLite.Offer,
    instrumentManager: FXConnectLite.IInstrumentsManager,
    session: FXConnectLite.IFXConnectLiteSession,
  ): string {
    let formatString: string;
    const offerId: string = offer.getOfferId();
    let symbol: string = 'UNKNOWN';
    const descriptors: FXConnectLite.InstrumentDescriptor[] = instrumentManager.getAllInstrumentDescriptors();
    for (const i in descriptors) {
      if (descriptors[i].getOfferId() == offerId) {
        symbol = descriptors[i].getSymbol();
        break;
      }
    }
    const accountsManager = session.getAccountsManager();
    const account = accountsManager.getAccountById(accountsManager.getAccountsInfo()[0].getId());
    const instrument = session.getInstrumentsManager().getInstrumentByOfferId(offerId);
    const pipCost = session.getTradingSettingsProvider().getPipCost(instrument, account);

    formatString = `${offer.getOfferId()} | ${symbol} | ${offer.getAsk()} | ${offer.getBid()} | ${offer.getHigh()} | ${offer.getLow()} | ${offer.getBidTradable()} | ${offer.getAskTradable()} | ${offer.getVolume()} | ${offer.getTime().toISOString().slice(0, 19)} | ${pipCost.getValue()} for ${pipCost.getQuantity()}`;
    return formatString;
  }
}

class LoginCallback implements FXConnectLite.ILoginCallback {
  private tradingTerminalSelector;
  private tradingTerminals;
  private sid;

  private requestTradingTerminal = (tradingTerminalSelector, tradingTerminals) => {
    return new Promise((resolve, reject) => {
      this.sid = options.terminal;
      this.tradingTerminalSelector = tradingTerminalSelector;
      this.tradingTerminals = tradingTerminals;
      if (this.sid.length == 0) {
        const rl: readline.Interface = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question(`Enter terminal name: `, (input) => {
          this.sid = input;
          this.check();
          rl.close();
        });
      } else {
        this.check();
      }
    });
  };
  private check = () => {
    let requestedTerminal = null;

    for (const terminal of this.tradingTerminals) {
      if (terminal.getSubId() === this.sid) {
        requestedTerminal = terminal;
        break;
      }
    }
    Printer.print(`Terminal selected: ${this.sid}`);
    if (requestedTerminal == null) {
      writeLog('Requested terminal not found');
      process.exit(1);
    } else {
      this.tradingTerminalSelector.selectTerminal(requestedTerminal);
    }
  };

  onLoginError(error: FXConnectLite.LoginError): void {
	writeLog('Login error: ' + error.getMessage() + ' (' + LoginCallback.errorCodeToString(error) + ')');
  }

  onTradingTerminalRequest(
    tradingTerminalSelector: FXConnectLite.ITradingTerminalSelector,
    tradingTerminals: FXConnectLite.ITradingTerminal[],
  ): void {
    writeLog('Available trading terminals:');
    for (const terminal of tradingTerminals) {
      writeLog(terminal.getSubId());
    }
    this.requestTradingTerminal(tradingTerminalSelector, tradingTerminals);
  }

  onPinCodeRequest(pinCodeSetter: FXConnectLite.IPinCodeSetter): void {
    pinCodeSetter.setPinCode(options.pin);
  }

  static errorCodeToString(error: FXConnectLite.LoginError): string {
    switch (error.getCode()) {
      case FXConnectLite.LoginError.CODE_EMPTY_PARAMETER:
        return 'EMPTY_PARAMETER';
      case FXConnectLite.LoginError.CODE_INCORRECT_PIN:
        return 'INCORRECT_PIN';
      case FXConnectLite.LoginError.CODE_WRONG_USERNAME_OR_PASSWORD:
        return 'WRONG_USERNAME_OR_PASSWORD';
      case FXConnectLite.LoginError.CODE_LOCKED_USER:
        return 'LOCKED_USER';
      case FXConnectLite.LoginError.CODE_SERVER_ERROR:
        return 'SERVER_ERROR';
      case FXConnectLite.LoginError.CODE_INCORRECT_TRADING_SYSTEM_URL:
        return 'INCORRECT_TRADING_SYSTEM_URL';
      case FXConnectLite.LoginError.CODE_INCORRECT_CONNECTION_NAME:
        return 'INCORRECT_CONNECTION_NAME';
      case FXConnectLite.LoginError.CODE_TIMEOUT:
        return 'TIMEOUT';
      default:
        return 'NOT_SPECIFIED';
    }
  }
}

class InstrumentsPrinter {
  private instrumentsManager: FXConnectLite.IInstrumentsManager;
  private tradingSettingsProvider: FXConnectLite.ITradingSettingsProvider;
  private accountsManager: FXConnectLite.IAccountsManager;
  private dividendsProvider: FXConnectLite.IDividendsProvider;
  private offersManager: FXConnectLite.IOffersManager;
  private marginProvider: FXConnectLite.IMarginProvider;
  private accountCommissionsManager: FXConnectLite.IAccountCommissionsManager;

  public constructor(
    instrumentManager: FXConnectLite.IInstrumentsManager,
    session: FXConnectLite.IFXConnectLiteSession,
  ) {
    this.instrumentsManager = instrumentManager;
    this.tradingSettingsProvider = session.getTradingSettingsProvider();
    this.accountsManager = session.getAccountsManager();
    this.offersManager = session.getOffersManager();
    this.marginProvider = session.getMarginProvider();
    this.accountCommissionsManager = session.getAccountCommissionsManager();
  }

  printInstruments(title: string, instruments: FXConnectLite.Instrument[]) {

    const accountsInfo = this.accountsManager.getAccountsInfo();
    const account = this.accountsManager.getAccountById(accountsInfo[0].getId());

    instruments.forEach((instrument) => {
      const minQuantity = this.tradingSettingsProvider.getMinQuantity(instrument, account);
      const offer = this.offersManager.getOfferById(instrument.getOfferId());
      let openBuyCommission = 0;
      let openSellCommission = 0;

      if (offer != null) {
        openBuyCommission = this.accountCommissionsManager.getOpenCommission(
          offer,
          account,
          minQuantity,
          'B',
          offer.getAsk(),
        );
        openSellCommission = this.accountCommissionsManager.getOpenCommission(
          offer,
          account,
          minQuantity,
          'S',
          offer.getBid(),
        );
      } else {
		writeLog('Not found offer with ID: ' + instrument.getOfferId());
      }

      let mmr = 0.0;
      try {
        mmr = this.marginProvider.getMMR(instrument, account);
      } catch {}
      Printer.print(
        InstrumentFormatter.format(
          instrument,
          this.dividendsProvider,
          account,
          minQuantity,
          openBuyCommission,
          openSellCommission,
          mmr,
        ),
      );
    });
  }

  print(): void {
    this.printInstruments(`All subscribed instruments:`, this.instrumentsManager.getSubscribedInstruments());
  }
}

class OffersStateChangeListener implements FXConnectLite.IDataManagerStateChangeListener {
  private offersManager: FXConnectLite.IOffersManager;
  private instrumentManager: FXConnectLite.IInstrumentsManager;
  private session: FXConnectLite.IFXConnectLiteSession;

  public constructor(
    offersManager: FXConnectLite.IOffersManager,
    instrumentManager: FXConnectLite.IInstrumentsManager,
    session: FXConnectLite.IFXConnectLiteSession,
  ) {
    this.offersManager = offersManager;
    this.instrumentManager = instrumentManager;
    this.session = session;
  }

  onStateChange(state: FXConnectLite.IDataManagerState): void {
    if (state.isLoaded()) {
      //this.printOffers(`Refreshed offers:`, this.offersManager.getAllOffers());
    }
  }
}

class OfferChangeListener implements FXConnectLite.IOfferChangeListener {
  private isFirstOfferChange: boolean = false;
  private instrumentsManager: FXConnectLite.IInstrumentsManager;
  private offersManager: FXConnectLite.IOffersManager;
  private session: FXConnectLite.IFXConnectLiteSession;

  public constructor(
    instrumentManager: FXConnectLite.IInstrumentsManager,
    offersManager: FXConnectLite.IOffersManager,
    session: FXConnectLite.IFXConnectLiteSession,
  ) {
    this.instrumentsManager = instrumentManager;
    this.offersManager = offersManager;
    this.session = session;
  }

	// Function to check if the new message is larger than 120 seconds of the previous message
	checkMessageTime(id: string, offer: FXConnectLite.Offer): void {
	  let previousOffer: FXConnectLite.Offer =  symbolMap.get(id);
	  
	  if (!previousOffer) {
		// If no previous message exists, store the new timestamp and return true
		symbolMap.set(id, offer);
	  }
	  
	  let symbol: string = 'UNKNOWN';
	  const instrumentsManager = this.session.getInstrumentsManager();
	  const descriptors: FXConnectLite.InstrumentDescriptor[] = instrumentsManager.getAllInstrumentDescriptors();
	  for (const i in descriptors) {
		 if (descriptors[i].getOfferId() == offer.getOfferId()) {
			symbol = descriptors[i].getSymbol();
			break;
		 }
	  }

	  // Calculate the time difference in seconds
	  const timeDifference = (offer.getTime().getTime() - previousOffer.getTime().getTime()) / 1000;
	  writeLog(symbol + ': update in ' + timeDifference + ' seconds');
	  
	  // Return true if the difference is larger than interval seconds, otherwise false
	  if(timeDifference > Number (process.env.INTERVAL)){
		writeLog("ALERT: " + symbol + " update in " + timeDifference + " seconds," + " longer than " + Number(process.env.INTERVAL));
		writeLog("Symbol:" + symbol + " id:" + offer.getOfferId() + " previousBid:" + previousOffer.getBid() + " previousAsk:" + previousOffer.getAsk() + " previousTime:" + previousOffer.getTime().toISOString().slice(0,19));
		writeLog("Symbol:" + symbol + " id:" + offer.getOfferId() + " currentBid:" + offer.getBid() + " currentAsk:" + offer.getAsk() + " currentTime:" + offer.getTime().toISOString().slice(0,19));
	  }
	  
	  // Update the map with the new timestamp
	  symbolMap.set(id, offer);
	}

  onChange(offerInfo: FXConnectLite.OfferInfo): void {
  
    let offer: FXConnectLite.Offer = this.offersManager.getOfferById(offerInfo.getOfferId());
	this.checkMessageTime(offer.getOfferId(), offer);
	
  }
  onAdd(offerInfo: FXConnectLite.OfferInfo): void {
    //do nothing
  }
}

class InstrumentChangeListener implements FXConnectLite.IInstrumentChangeListener {
  private instrumentsManager: FXConnectLite.IInstrumentsManager;
  private tradingSettingsProvider: FXConnectLite.ITradingSettingsProvider;
  private accountsManager: FXConnectLite.IAccountsManager;
  private dividendsProvider: FXConnectLite.IDividendsProvider;
  private offersManager: FXConnectLite.IOffersManager;
  private accountCommissionsManager: FXConnectLite.IAccountCommissionsManager;
  private marginProvider: FXConnectLite.IMarginProvider;

  public constructor(
    instrumentManager: FXConnectLite.IInstrumentsManager,
    session: FXConnectLite.IFXConnectLiteSession,
  ) {
    this.instrumentsManager = instrumentManager;
    this.tradingSettingsProvider = session.getTradingSettingsProvider();
    this.accountsManager = session.getAccountsManager();
    this.offersManager = session.getOffersManager();
    this.marginProvider = session.getMarginProvider();
    this.accountCommissionsManager = session.getAccountCommissionsManager();
  }

  onChange(instrument: FXConnectLite.Instrument): void {
    const accountsInfo = this.accountsManager.getAccountsInfo();
    const account = this.accountsManager.getAccountById(accountsInfo[0].getId());
    const minQuantity = this.tradingSettingsProvider.getMinQuantity(instrument, account);
    const offer = this.offersManager.getOfferById(instrument.getOfferId());
    let openBuyCommission = 0;
    let openSellCommission = 0;
    if (offer != null) {
      openBuyCommission = this.accountCommissionsManager.getOpenCommission(
        offer,
        account,
        minQuantity,
        'B',
        offer.getAsk(),
      );
      openSellCommission = this.accountCommissionsManager.getOpenCommission(
        offer,
        account,
        minQuantity,
        'S',
        offer.getBid(),
      );
    } else {
      Printer.print('Not found offer with ID: ' + instrument.getOfferId());
    }

    let mmr = 0.0;
    try {
      mmr = this.marginProvider.getMMR(instrument, account);
    } catch {}

    Printer.print(``);
    Printer.print(`Instrument changes:`);
    Printer.print(``);
    Printer.print(InstrumentFormatter.TITLE);
    Printer.print(
      InstrumentFormatter.format(
        instrument,
        this.dividendsProvider,
        account,
        minQuantity,
        openBuyCommission,
        openSellCommission,
        mmr,
      ),
    );
    Printer.print(``);
  }

  onAdd(instrument: FXConnectLite.Instrument): void {
    const accountsInfo = this.accountsManager.getAccountsInfo();
    const account = this.accountsManager.getAccountById(accountsInfo[0].getId());
    const minQuantity = this.tradingSettingsProvider.getMinQuantity(instrument, account);
    const offer = this.offersManager.getOfferById(instrument.getOfferId());
    let openBuyCommission = 0;
    let openSellCommission = 0;
    if (offer != null) {
      openBuyCommission = this.accountCommissionsManager.getOpenCommission(
        offer,
        account,
        minQuantity,
        'B',
        offer.getAsk(),
      );
      openSellCommission = this.accountCommissionsManager.getOpenCommission(
        offer,
        account,
        minQuantity,
        'S',
        offer.getBid(),
      );
    } else {
      Printer.print('Not found offer with ID: ' + instrument.getOfferId());
    }

    let mmr = 0.0;
    try {
      mmr = this.marginProvider.getMMR(instrument, account);
    } catch {}

    Printer.print(``);
    Printer.print(`Instrument added:`);
    Printer.print(``);
    Printer.print(InstrumentFormatter.TITLE);
    Printer.print(
      InstrumentFormatter.format(
        instrument,
        this.dividendsProvider,
        account,
        minQuantity,
        openBuyCommission,
        openSellCommission,
        mmr,
      ),
    );
  }
}

class CompleteLoadingHandler implements FXConnectLite.IDataManagerStateChangeListener {
  resolve;
  targetCount;
  count;
  timeoutHandler;

  constructor(resolve, timeout) {
    this.resolve = resolve;
    const me = this;
    this.timeoutHandler = setTimeout(function () {
      me.resolve();
    }, timeout);
  }

  onStateChange(state: FXConnectLite.IDataManagerState): void {
    if (state.isLoaded()) {
      clearTimeout(this.timeoutHandler);
      this.resolve();
    }
  }
}

class UnsubscribeCallback implements FXConnectLite.ISubscribeInstrumentsCallback {
  resolve;

  constructor(resolve) {
    this.resolve = resolve;
  }

  onSuccess() {
    writeLog('Unsubscribe success');
    this.resolve();
  }
  onError(error: string) {
    writeLog('Unsubscribe error: ' + error);
    this.resolve();
  }
}

class SubscribeCallback implements FXConnectLite.ISubscribeInstrumentsCallback {
  resolve;

  constructor(resolve) {
    this.resolve = resolve;
  }
  onSuccess() {
	writeLog('Subscribe success');
    this.resolve();
  }
  onError(error: string) {
	writeLog('Subscribe error: ' + error);
    this.resolve();
  }
}

class Application {
  private sampleTimeout: number = Number(process.env.sampleTimeout);
  private unsubscribeTimeout: number = Number(process.env.unsubscribeTimeout);
  private subscribeTimeout: number = Number(process.env.subscribeTimeout);
  private timeout: number = Number(process.env.timeout);
  private instrumentSymbol: string;
  //private instrumentSymbols: string[] = ['EUR/USD','USD/JPY','SPX500', 'GER30', 'ETHBTC', 'BTC/USD', 'XAU/USD', 'XAG/USD', 'AAPL.us', 'TSLA.us', 'SPY.us', 'QQQ.us'];

  private instrumentSymbols = process.env.CURRENCY_PAIRS ? process.env.CURRENCY_PAIRS.split(',') : [];
  
  private login = async (session, user, password, tradingSystemUrl, connectionName, loginCallback) => {
    return new Promise<void>((resolve, reject) => {
      session.subscribeConnectionStatusChange(
        new CompleteLoginConnectionStatusChangeListener(resolve, reject, session),
      );
      session.login(user, password, tradingSystemUrl, connectionName, loginCallback);
    });
  };

  private update = async () => {
    return new Promise<void>((resolve, reject) => {
      const me = this;
      setTimeout(function () {
        resolve();
      }, me.sampleTimeout);
    });
  };

  private subscribeToInstrument = async (instrumentsManager, session) => {
    return new Promise<void>((resolve, reject) => {
      const me = this;
      setTimeout(function () {
			
		me.instrumentSymbols.forEach((instrument) => {
			writeLog('Subscribe to ' + instrument);
			instrumentsManager.subscribeInstruments([instrument], new SubscribeCallback(resolve));
		});		

      }, me.subscribeTimeout);
    });
  };

  private loadOffers = async (session) => {
    return new Promise<void>((resolve, reject) => {
      if (session.getOffersManager().getState().isLoaded()) resolve();
      else {
        const completeHandler = new CompleteLoadingHandler(resolve, this.timeout);
        session.getOffersManager().subscribeStateChange(completeHandler);
        session.getOffersManager().refresh();
      }
    });
  };


  main(): void {
    const session = FXConnectLite.FXConnectLiteSessionFactory.create(`GetOffersSample`);
    session.subscribeConnectionStatusChange(new ConnectionStatusChangeListener());
    const instrumentsManager = session.getInstrumentsManager();
    const accountCommissionsManager = session.getAccountCommissionsManager();
    const accountsManager = session.getAccountsManager();

    const offersManager = session.getOffersManager();
    // 1 - subscribe to the instrumentManager state change to get an event when information about all instruments has been loaded
    const instrumentsPrinter = new InstrumentsPrinter(instrumentsManager, session);
    instrumentsManager.subscribeInstrumentChange(new InstrumentChangeListener(instrumentsManager, session));
    // 2 - subscribe to the offersManager change to get an event when offer data has changed
    offersManager.subscribeOfferChange(new OfferChangeListener(instrumentsManager, offersManager, session));
    offersManager.subscribeStateChange(new OffersStateChangeListener(offersManager, instrumentsManager, session));

	writeLog('Login...');
    this.login(
      session,
	  process.env.API_USER_NAME, 
	  process.env.API_PASSWORD, 
	  process.env.TRADING_SYSTEM_URL, 
	  process.env.CONNECTION_NAME,
      new LoginCallback(),
    )
      .then(() => {
        if (session.getConnectionStatus().isConnected()) {
		  return;
        }
      })
      .then(() => {
		writeLog('Load offers...');
        return this.loadOffers(session);
      })
      .then(() => {
        return this.subscribeToInstrument(instrumentsManager, session);
      })
      .then(() => {
        return this.update();
      })
      .then(() => {
		writeLog('Logout...');
        session.logout();
      })
      .catch(() => {
        //do nothing
      });
  }
}

const application = new Application();
application.main();
