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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = void 0;
var FXConnectLite = require("@gehtsoft/traduAPI-node");
var commander_1 = require("commander");
var readline = require("readline");
var fs = require("fs");
var path = require("path");
var dotenv = require('dotenv');
dotenv.config();
console.log(process.env.API_USER_NAME);
exports.options = commander_1.program.opts();
var symbolMap = new Map();
// Assuming `getFormattedDate` is a function that returns a formatted date string
function getFormattedDate() {
    var date = new Date();
    return "".concat(date.getFullYear(), "-").concat((date.getMonth() + 1).toString().padStart(2, '0'), "-").concat(date.getDate().toString().padStart(2, '0'));
}
var logDir = path.join(__dirname, '..', 'logs');
var logFileName = "app-".concat(getFormattedDate(), ".log");
var logFilePath = path.join(logDir, logFileName);
// Ensure the 'log' directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
// Function to write to the log file
var writeLog = function (message) {
    var timestamp = new Date().toISOString();
    var logMessage = "".concat(timestamp, " - ").concat(message, "\n");
    // Append log message to the file
    fs.appendFile(logFilePath, logMessage, function (err) {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
};
var ConnectionStatusChangeListener = /** @class */ (function () {
    function ConnectionStatusChangeListener() {
    }
    ConnectionStatusChangeListener.prototype.onConnectionStatusChange = function (status) {
        writeLog('Connection status changed. ' + this.getStatusString(status));
    };
    ConnectionStatusChangeListener.prototype.getStatusString = function (status) {
        return ((status.isConnected() ? 'Connected' : '') +
            (status.isConnecting() ? 'Connecting' : '') +
            (status.isReconnecting() ? 'Reconnecting' : '') +
            (status.isDisconnected() ? 'Disconnected' : ''));
    };
    return ConnectionStatusChangeListener;
}());
var CompleteLoginConnectionStatusChangeListener = /** @class */ (function () {
    function CompleteLoginConnectionStatusChangeListener(completeLoginResolve, loginReject, session) {
        this.completeLoginResolve = completeLoginResolve;
        this.loginReject = loginReject;
        this.session = session;
    }
    CompleteLoginConnectionStatusChangeListener.prototype.onConnectionStatusChange = function (status) {
        if (status.isConnected()) {
            this.session.unsubscribeConnectionStatusChange(this);
            this.completeLoginResolve();
        }
        else if (status.isDisconnected()) {
            this.session.unsubscribeConnectionStatusChange(this);
            this.loginReject();
        }
    };
    return CompleteLoginConnectionStatusChangeListener;
}());
var Printer = /** @class */ (function () {
    function Printer() {
    }
    Printer.print = function (message) {
        console.log(message);
    };
    return Printer;
}());
var InstrumentFormatter = /** @class */ (function () {
    function InstrumentFormatter() {
    }
    InstrumentFormatter.format = function (instrument, dividendsProvider, account, minQuantity, openBuyCommission, openSellCommission, mmr) {
        var formatString;
        formatString =
            "".concat(instrument.getOfferId(), " | ").concat(instrument.getSymbol(), " | ").concat(instrument.getContractCurrency(), " | ") +
                "".concat(instrument.getDigits(), " | ").concat(instrument.getPointSize(), " | ").concat(instrument.getInstrumentType(), " | ") +
                "".concat(instrument.getTradingStatus(), " | ").concat(instrument.getContractMultiplier(), " | ").concat(instrument.getSellInterest(), " | ") +
                "".concat(instrument.getBuyInterest(), " | ").concat(instrument.getSubscriptionStatus(), " | ").concat(instrument.getDividendSell(), " | ") +
                "".concat(instrument.getDividendBuy(), " | ").concat(instrument.hasDividendSell(), " | ").concat(instrument.hasDividendBuy(), " | ") +
                "".concat(minQuantity, " | ").concat(openBuyCommission, " | ").concat(openSellCommission, " | ").concat(mmr, " | ").concat(instrument.getSortOrder(), " | ") +
                "".concat(instrument.getPriceStreamId(), " | ").concat(instrument.getConditionDistStop(), " | ").concat(instrument.getConditionDistLimit(), " | ").concat(instrument.getConditionDistEntryStop(), " | ") +
                "".concat(instrument.getConditionDistEntryLimit(), " | ").concat(instrument.getAskAdjustment(), " | ").concat(instrument.getBidAdjustment(), " | ").concat(instrument.getFractionalPipSize());
        return formatString;
    };
    InstrumentFormatter.TITLE = "OfferId | Symbol | Currency | Digits | PointSize | Type | TradingStatus | Multiplier | SellInt |" +
        " BuyInt | SubscriptionStatus | DividendSell | DividendBuy | hasDividendSell | hasDividendBuy | MinQuantity | OpenBuyComm |" +
        " OpenSellComm | MMR | SortOrder | PriceStreamId | ConditionDistStop | ConditionDistLimit | ConditionDistEntryStop | ConditionDistEntryLimit| AskAdjustment | BidAdjustment | Fractional pip size";
    return InstrumentFormatter;
}());
var OfferFormatter = /** @class */ (function () {
    function OfferFormatter() {
    }
    OfferFormatter.format = function (offer, instrumentManager, session) {
        var formatString;
        var offerId = offer.getOfferId();
        var symbol = 'UNKNOWN';
        var descriptors = instrumentManager.getAllInstrumentDescriptors();
        for (var i in descriptors) {
            if (descriptors[i].getOfferId() == offerId) {
                symbol = descriptors[i].getSymbol();
                break;
            }
        }
        var accountsManager = session.getAccountsManager();
        var account = accountsManager.getAccountById(accountsManager.getAccountsInfo()[0].getId());
        var instrument = session.getInstrumentsManager().getInstrumentByOfferId(offerId);
        var pipCost = session.getTradingSettingsProvider().getPipCost(instrument, account);
        formatString = "".concat(offer.getOfferId(), " | ").concat(symbol, " | ").concat(offer.getAsk(), " | ").concat(offer.getBid(), " | ").concat(offer.getHigh(), " | ").concat(offer.getLow(), " | ").concat(offer.getBidTradable(), " | ").concat(offer.getAskTradable(), " | ").concat(offer.getVolume(), " | ").concat(offer.getTime().toISOString().slice(0, 19), " | ").concat(pipCost.getValue(), " for ").concat(pipCost.getQuantity());
        return formatString;
    };
    OfferFormatter.TITLE = "OfferId | Symbol | Ask | Bid | High | Low | BidTradable | AskTradable | Volume | Time | PipCost";
    return OfferFormatter;
}());
var LoginCallback = /** @class */ (function () {
    function LoginCallback() {
        var _this = this;
        this.requestTradingTerminal = function (tradingTerminalSelector, tradingTerminals) {
            return new Promise(function (resolve, reject) {
                _this.sid = exports.options.terminal;
                _this.tradingTerminalSelector = tradingTerminalSelector;
                _this.tradingTerminals = tradingTerminals;
                if (_this.sid.length == 0) {
                    var rl_1 = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });
                    rl_1.question("Enter terminal name: ", function (input) {
                        _this.sid = input;
                        _this.check();
                        rl_1.close();
                    });
                }
                else {
                    _this.check();
                }
            });
        };
        this.check = function () {
            var requestedTerminal = null;
            for (var _i = 0, _a = _this.tradingTerminals; _i < _a.length; _i++) {
                var terminal = _a[_i];
                if (terminal.getSubId() === _this.sid) {
                    requestedTerminal = terminal;
                    break;
                }
            }
            Printer.print("Terminal selected: ".concat(_this.sid));
            if (requestedTerminal == null) {
                writeLog('Requested terminal not found');
                process.exit(1);
            }
            else {
                _this.tradingTerminalSelector.selectTerminal(requestedTerminal);
            }
        };
    }
    LoginCallback.prototype.onLoginError = function (error) {
        writeLog('Login error: ' + error.getMessage() + ' (' + LoginCallback.errorCodeToString(error) + ')');
    };
    LoginCallback.prototype.onTradingTerminalRequest = function (tradingTerminalSelector, tradingTerminals) {
        writeLog('Available trading terminals:');
        for (var _i = 0, tradingTerminals_1 = tradingTerminals; _i < tradingTerminals_1.length; _i++) {
            var terminal = tradingTerminals_1[_i];
            writeLog(terminal.getSubId());
        }
        this.requestTradingTerminal(tradingTerminalSelector, tradingTerminals);
    };
    LoginCallback.prototype.onPinCodeRequest = function (pinCodeSetter) {
        pinCodeSetter.setPinCode(exports.options.pin);
    };
    LoginCallback.errorCodeToString = function (error) {
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
    };
    return LoginCallback;
}());
var InstrumentsPrinter = /** @class */ (function () {
    function InstrumentsPrinter(instrumentManager, session) {
        this.instrumentsManager = instrumentManager;
        this.tradingSettingsProvider = session.getTradingSettingsProvider();
        this.accountsManager = session.getAccountsManager();
        this.offersManager = session.getOffersManager();
        this.marginProvider = session.getMarginProvider();
        this.accountCommissionsManager = session.getAccountCommissionsManager();
    }
    InstrumentsPrinter.prototype.printInstruments = function (title, instruments) {
        var _this = this;
        var accountsInfo = this.accountsManager.getAccountsInfo();
        var account = this.accountsManager.getAccountById(accountsInfo[0].getId());
        instruments.forEach(function (instrument) {
            var minQuantity = _this.tradingSettingsProvider.getMinQuantity(instrument, account);
            var offer = _this.offersManager.getOfferById(instrument.getOfferId());
            var openBuyCommission = 0;
            var openSellCommission = 0;
            if (offer != null) {
                openBuyCommission = _this.accountCommissionsManager.getOpenCommission(offer, account, minQuantity, 'B', offer.getAsk());
                openSellCommission = _this.accountCommissionsManager.getOpenCommission(offer, account, minQuantity, 'S', offer.getBid());
            }
            else {
                writeLog('Not found offer with ID: ' + instrument.getOfferId());
            }
            var mmr = 0.0;
            try {
                mmr = _this.marginProvider.getMMR(instrument, account);
            }
            catch (_a) { }
            Printer.print(InstrumentFormatter.format(instrument, _this.dividendsProvider, account, minQuantity, openBuyCommission, openSellCommission, mmr));
        });
    };
    InstrumentsPrinter.prototype.print = function () {
        this.printInstruments("All subscribed instruments:", this.instrumentsManager.getSubscribedInstruments());
    };
    return InstrumentsPrinter;
}());
var OffersStateChangeListener = /** @class */ (function () {
    function OffersStateChangeListener(offersManager, instrumentManager, session) {
        this.offersManager = offersManager;
        this.instrumentManager = instrumentManager;
        this.session = session;
    }
    OffersStateChangeListener.prototype.onStateChange = function (state) {
        if (state.isLoaded()) {
            //this.printOffers(`Refreshed offers:`, this.offersManager.getAllOffers());
        }
    };
    return OffersStateChangeListener;
}());
var OfferChangeListener = /** @class */ (function () {
    function OfferChangeListener(instrumentManager, offersManager, session) {
        this.isFirstOfferChange = false;
        this.instrumentsManager = instrumentManager;
        this.offersManager = offersManager;
        this.session = session;
    }
    // Function to check if the new message is larger than 120 seconds of the previous message
    OfferChangeListener.prototype.checkMessageTime = function (id, offer) {
        var previousOffer = symbolMap.get(id);
        if (!previousOffer) {
            // If no previous message exists, store the new timestamp and return true
            symbolMap.set(id, offer);
        }
        var symbol = 'UNKNOWN';
        var instrumentsManager = this.session.getInstrumentsManager();
        var descriptors = instrumentsManager.getAllInstrumentDescriptors();
        for (var i in descriptors) {
            if (descriptors[i].getOfferId() == offer.getOfferId()) {
                symbol = descriptors[i].getSymbol();
                break;
            }
        }
        // Calculate the time difference in seconds
        var timeDifference = (offer.getTime().getTime() - previousOffer.getTime().getTime()) / 1000;
        writeLog(symbol + ': update in ' + timeDifference + ' seconds');
        // Return true if the difference is larger than interval seconds, otherwise false
        if (timeDifference > Number(process.env.INTERVAL)) {
            writeLog("ALERT: " + symbol + " update in " + timeDifference + " seconds," + " longer than " + Number(process.env.INTERVAL));
            writeLog("Symbol:" + symbol + " id:" + offer.getOfferId() + " previousBid:" + previousOffer.getBid() + " previousAsk:" + previousOffer.getAsk() + " previousTime:" + previousOffer.getTime().toISOString().slice(0, 19));
            writeLog("Symbol:" + symbol + " id:" + offer.getOfferId() + " currentBid:" + offer.getBid() + " currentAsk:" + offer.getAsk() + " currentTime:" + offer.getTime().toISOString().slice(0, 19));
        }
        // Update the map with the new timestamp
        symbolMap.set(id, offer);
    };
    OfferChangeListener.prototype.onChange = function (offerInfo) {
        var offer = this.offersManager.getOfferById(offerInfo.getOfferId());
        this.checkMessageTime(offer.getOfferId(), offer);
    };
    OfferChangeListener.prototype.onAdd = function (offerInfo) {
        //do nothing
    };
    return OfferChangeListener;
}());
var InstrumentChangeListener = /** @class */ (function () {
    function InstrumentChangeListener(instrumentManager, session) {
        this.instrumentsManager = instrumentManager;
        this.tradingSettingsProvider = session.getTradingSettingsProvider();
        this.accountsManager = session.getAccountsManager();
        this.offersManager = session.getOffersManager();
        this.marginProvider = session.getMarginProvider();
        this.accountCommissionsManager = session.getAccountCommissionsManager();
    }
    InstrumentChangeListener.prototype.onChange = function (instrument) {
        var accountsInfo = this.accountsManager.getAccountsInfo();
        var account = this.accountsManager.getAccountById(accountsInfo[0].getId());
        var minQuantity = this.tradingSettingsProvider.getMinQuantity(instrument, account);
        var offer = this.offersManager.getOfferById(instrument.getOfferId());
        var openBuyCommission = 0;
        var openSellCommission = 0;
        if (offer != null) {
            openBuyCommission = this.accountCommissionsManager.getOpenCommission(offer, account, minQuantity, 'B', offer.getAsk());
            openSellCommission = this.accountCommissionsManager.getOpenCommission(offer, account, minQuantity, 'S', offer.getBid());
        }
        else {
            Printer.print('Not found offer with ID: ' + instrument.getOfferId());
        }
        var mmr = 0.0;
        try {
            mmr = this.marginProvider.getMMR(instrument, account);
        }
        catch (_a) { }
        Printer.print("");
        Printer.print("Instrument changes:");
        Printer.print("");
        Printer.print(InstrumentFormatter.TITLE);
        Printer.print(InstrumentFormatter.format(instrument, this.dividendsProvider, account, minQuantity, openBuyCommission, openSellCommission, mmr));
        Printer.print("");
    };
    InstrumentChangeListener.prototype.onAdd = function (instrument) {
        var accountsInfo = this.accountsManager.getAccountsInfo();
        var account = this.accountsManager.getAccountById(accountsInfo[0].getId());
        var minQuantity = this.tradingSettingsProvider.getMinQuantity(instrument, account);
        var offer = this.offersManager.getOfferById(instrument.getOfferId());
        var openBuyCommission = 0;
        var openSellCommission = 0;
        if (offer != null) {
            openBuyCommission = this.accountCommissionsManager.getOpenCommission(offer, account, minQuantity, 'B', offer.getAsk());
            openSellCommission = this.accountCommissionsManager.getOpenCommission(offer, account, minQuantity, 'S', offer.getBid());
        }
        else {
            Printer.print('Not found offer with ID: ' + instrument.getOfferId());
        }
        var mmr = 0.0;
        try {
            mmr = this.marginProvider.getMMR(instrument, account);
        }
        catch (_a) { }
        Printer.print("");
        Printer.print("Instrument added:");
        Printer.print("");
        Printer.print(InstrumentFormatter.TITLE);
        Printer.print(InstrumentFormatter.format(instrument, this.dividendsProvider, account, minQuantity, openBuyCommission, openSellCommission, mmr));
    };
    return InstrumentChangeListener;
}());
var CompleteLoadingHandler = /** @class */ (function () {
    function CompleteLoadingHandler(resolve, timeout) {
        this.resolve = resolve;
        var me = this;
        this.timeoutHandler = setTimeout(function () {
            me.resolve();
        }, timeout);
    }
    CompleteLoadingHandler.prototype.onStateChange = function (state) {
        if (state.isLoaded()) {
            clearTimeout(this.timeoutHandler);
            this.resolve();
        }
    };
    return CompleteLoadingHandler;
}());
var UnsubscribeCallback = /** @class */ (function () {
    function UnsubscribeCallback(resolve) {
        this.resolve = resolve;
    }
    UnsubscribeCallback.prototype.onSuccess = function () {
        writeLog('Unsubscribe success');
        this.resolve();
    };
    UnsubscribeCallback.prototype.onError = function (error) {
        writeLog('Unsubscribe error: ' + error);
        this.resolve();
    };
    return UnsubscribeCallback;
}());
var SubscribeCallback = /** @class */ (function () {
    function SubscribeCallback(resolve) {
        this.resolve = resolve;
    }
    SubscribeCallback.prototype.onSuccess = function () {
        writeLog('Subscribe success');
        this.resolve();
    };
    SubscribeCallback.prototype.onError = function (error) {
        writeLog('Subscribe error: ' + error);
        this.resolve();
    };
    return SubscribeCallback;
}());
var Application = /** @class */ (function () {
    function Application() {
        var _this = this;
        this.sampleTimeout = Number(process.env.sampleTimeout);
        this.unsubscribeTimeout = Number(process.env.unsubscribeTimeout);
        this.subscribeTimeout = Number(process.env.subscribeTimeout);
        this.timeout = Number(process.env.timeout);
        //private instrumentSymbols: string[] = ['EUR/USD','USD/JPY','SPX500', 'GER30', 'ETHBTC', 'BTC/USD', 'XAU/USD', 'XAG/USD', 'AAPL.us', 'TSLA.us', 'SPY.us', 'QQQ.us'];
        this.instrumentSymbols = process.env.CURRENCY_PAIRS ? process.env.CURRENCY_PAIRS.split(',') : [];
        this.login = function (session, user, password, tradingSystemUrl, connectionName, loginCallback) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        session.subscribeConnectionStatusChange(new CompleteLoginConnectionStatusChangeListener(resolve, reject, session));
                        session.login(user, password, tradingSystemUrl, connectionName, loginCallback);
                    })];
            });
        }); };
        this.update = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var me = _this;
                        setTimeout(function () {
                            resolve();
                        }, me.sampleTimeout);
                    })];
            });
        }); };
        this.subscribeToInstrument = function (instrumentsManager, session) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var me = _this;
                        setTimeout(function () {
                            me.instrumentSymbols.forEach(function (instrument) {
                                writeLog('Subscribe to ' + instrument);
                                instrumentsManager.subscribeInstruments([instrument], new SubscribeCallback(resolve));
                            });
                        }, me.subscribeTimeout);
                    })];
            });
        }); };
        this.loadOffers = function (session) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (session.getOffersManager().getState().isLoaded())
                            resolve();
                        else {
                            var completeHandler = new CompleteLoadingHandler(resolve, _this.timeout);
                            session.getOffersManager().subscribeStateChange(completeHandler);
                            session.getOffersManager().refresh();
                        }
                    })];
            });
        }); };
    }
    Application.prototype.main = function () {
        var _this = this;
        var session = FXConnectLite.FXConnectLiteSessionFactory.create("GetOffersSample");
        session.subscribeConnectionStatusChange(new ConnectionStatusChangeListener());
        var instrumentsManager = session.getInstrumentsManager();
        var accountCommissionsManager = session.getAccountCommissionsManager();
        var accountsManager = session.getAccountsManager();
        var offersManager = session.getOffersManager();
        // 1 - subscribe to the instrumentManager state change to get an event when information about all instruments has been loaded
        var instrumentsPrinter = new InstrumentsPrinter(instrumentsManager, session);
        instrumentsManager.subscribeInstrumentChange(new InstrumentChangeListener(instrumentsManager, session));
        // 2 - subscribe to the offersManager change to get an event when offer data has changed
        offersManager.subscribeOfferChange(new OfferChangeListener(instrumentsManager, offersManager, session));
        offersManager.subscribeStateChange(new OffersStateChangeListener(offersManager, instrumentsManager, session));
        writeLog('Login...');
        this.login(session, process.env.API_USER_NAME, process.env.API_PASSWORD, process.env.TRADING_SYSTEM_URL, process.env.CONNECTION_NAME, new LoginCallback())
            .then(function () {
            if (session.getConnectionStatus().isConnected()) {
                return;
            }
        })
            .then(function () {
            writeLog('Load offers...');
            return _this.loadOffers(session);
        })
            .then(function () {
            return _this.subscribeToInstrument(instrumentsManager, session);
        })
            .then(function () {
            return _this.update();
        })
            .then(function () {
            writeLog('Logout...');
            session.logout();
        })
            .catch(function () {
            //do nothing
        });
    };
    return Application;
}());
var application = new Application();
application.main();
//# sourceMappingURL=get_offers.js.map