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
exports.TurnTaker = exports.OnePlayerController = exports.TwoPlayerController = exports.PlayerController = exports.LanguageGameController = void 0;
const models_1 = require("./models");
const information_state_1 = require("./information_state");
const actions_1 = require("./actions");
class LanguageGameController {
    constructor(twoPlayerController) {
        this.twoPlayerController = twoPlayerController;
    }
    playGame() {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this.twoPlayerController.isGameOver()) {
                yield this.twoPlayerController.runRound();
            }
            return this.twoPlayerController.getGameResults();
        });
    }
}
exports.LanguageGameController = LanguageGameController;
class PlayerController {
    constructor(turnTaker) {
        this.turnTaker = turnTaker;
    }
    resolveDiscourseUnderDiscussion(thisPlayerTotalInformationState, playerMove) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((playerMove === null || playerMove === void 0 ? void 0 : playerMove.illocutionaryRelation) === models_1.IllocutionaryRelation.ACCEPT) {
                yield this.turnTaker.resolveDiscourseUnderDiscussion(thisPlayerTotalInformationState);
            }
        });
    }
}
exports.PlayerController = PlayerController;
class TwoPlayerController extends PlayerController {
    constructor(players, turnTaker, rounds) {
        super(turnTaker);
        this.currentRound = 0;
        this.players = players;
        this.rounds = rounds;
        this.dialogStates = TwoPlayerController.initializeDialogStates(players);
    }
    runRound() {
        return __awaiter(this, void 0, void 0, function* () {
            const [playerName1, playerName2] = this.players.map((player) => player.name);
            const playerTotalInformationState1 = this.getTotalInformationStateForPlayer(playerName1);
            const playerTotalInformationState2 = this.getTotalInformationStateForPlayer(playerName2);
            yield this.executeTurn(playerName1, playerName2, playerTotalInformationState1, playerTotalInformationState2);
            yield this.executeTurn(playerName2, playerName1, playerTotalInformationState2, playerTotalInformationState1);
            this.currentRound++;
        });
    }
    isGameOver() {
        return this.currentRound >= this.rounds;
    }
    getGameResults() {
        return {
            totalInformationStates: TwoPlayerController.statesToArray(this.dialogStates),
        };
    }
    getTotalInformationStateForPlayer(playerName) {
        var _a;
        return ((_a = this.dialogStates.get(playerName)) !== null && _a !== void 0 ? _a : throwError("Missing total information state for " + playerName));
    }
    executeTurn(thisPlayerName, otherPlayerName, thisPlayerTotalInformationState, otherPlayerTotalInformationState) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!thisPlayerTotalInformationState.privateInformationState) {
                throw new Error("This Private Information State can't be null");
            }
            if (!otherPlayerTotalInformationState.privateInformationState) {
                throw new Error("Other Private Information State can't be null");
            }
            if (otherPlayerTotalInformationState.dgb &&
                otherPlayerTotalInformationState.dgb.moves &&
                otherPlayerTotalInformationState.dgb.moves.length !== 0) {
                const otherPlayUtterance = (_c = (_b = (_a = otherPlayerTotalInformationState.dgb) === null || _a === void 0 ? void 0 : _a.getLatestMove()) === null || _b === void 0 ? void 0 : _b.utterance) !== null && _c !== void 0 ? _c : "";
                const discourse = thisPlayerTotalInformationState.dgb.getDiscourseAsString();
                const otherPlayerMove = yield this.turnTaker.identifyMoveWithOtherUtterance(thisPlayerName, otherPlayerName, otherPlayUtterance, discourse);
                thisPlayerTotalInformationState.dgb.playLatestMove(otherPlayerMove);
                yield this.resolveDiscourseUnderDiscussion(thisPlayerTotalInformationState, otherPlayerMove);
                console.log(`ExecuteTurn - Other Player: ${otherPlayerMove}`);
            }
            yield this.turnTaker.takeTurn(thisPlayerName, otherPlayerName, thisPlayerTotalInformationState);
            const thisPlayerMove = thisPlayerTotalInformationState.dgb.getLatestMove();
            yield this.resolveDiscourseUnderDiscussion(thisPlayerTotalInformationState, thisPlayerMove);
        });
    }
}
exports.TwoPlayerController = TwoPlayerController;
TwoPlayerController.initializeDialogStates = (players) => players.reduce((map, player) => map.set(player.name, new information_state_1.DialogTIS(new information_state_1.DialogGameBoard(player.totalInformationState.dialogGameboard), new information_state_1.DialogPIS(player.totalInformationState.privateInformationState))), new Map());
TwoPlayerController.statesToArray = (totalInformationStates) => Array.from(totalInformationStates.entries()).map(([playerName, totalInformationState]) => ({
    playerName,
    totalInformationState: totalInformationState.toJson(),
}));
class OnePlayerController extends PlayerController {
    constructor(thisPlayer, turnTaker) {
        super(turnTaker);
        this.thisPlayer = thisPlayer;
        this.thisPlayerTotalInformationState = new information_state_1.DialogTIS(new information_state_1.DialogGameBoard(thisPlayer.totalInformationState.dialogGameboard), new information_state_1.DialogPIS(thisPlayer.totalInformationState.privateInformationState));
    }
    runTurn(otherPlayerName, otherPlayerUtterance) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.thisPlayerTotalInformationState.privateInformationState) {
                throw new Error("This Private Information State can't be null");
            }
            const discourse = this.thisPlayerTotalInformationState.dgb.getDiscourseAsString();
            if (otherPlayerUtterance && otherPlayerUtterance !== "") {
                const otherPlayerMove = yield this.turnTaker.identifyMoveWithOtherUtterance(this.thisPlayer.name, otherPlayerName, otherPlayerUtterance, discourse);
                this.thisPlayerTotalInformationState.dgb.playLatestMove(otherPlayerMove);
                yield this.resolveDiscourseUnderDiscussion(this.thisPlayerTotalInformationState, otherPlayerMove);
                console.log(`ExecuteTurn - Other Player: ${otherPlayerMove}`);
            }
            yield this.turnTaker.takeTurn(this.thisPlayer.name, otherPlayerName, this.thisPlayerTotalInformationState);
            const thisPlayerMove = this.thisPlayerTotalInformationState.dgb.getLatestMove();
            yield this.resolveDiscourseUnderDiscussion(this.thisPlayerTotalInformationState, thisPlayerMove);
        });
    }
    getGameResults() {
        var _a;
        return {
            playerName: this.thisPlayer.name,
            playerUtterance: ((_a = this.thisPlayerTotalInformationState.dgb.getLatestMove()) === null || _a === void 0 ? void 0 : _a.utterance) || "N/A",
            totalInformationState: this.thisPlayerTotalInformationState.toJson(),
        };
    }
}
exports.OnePlayerController = OnePlayerController;
class TurnTaker {
    constructor(modelConfig) {
        this.modelConfig = modelConfig;
    }
    takeTurn(thisPlayerName, otherPlayerName, thisPlayerTotalInformationState) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            console.log(`Starting turn for player: ${thisPlayerName}`);
            if (!thisPlayerTotalInformationState.privateInformationState) {
                throw new Error("Private Information State can't be null");
            }
            const latestMove = (_a = thisPlayerTotalInformationState.dgb) === null || _a === void 0 ? void 0 : _a.getLatestMove();
            const illocutionaryRelation = latestMove === null || latestMove === void 0 ? void 0 : latestMove.illocutionaryRelation;
            if (illocutionaryRelation) {
                yield ((_b = actions_1.actionIllocutionaryRelationMap
                    .get(illocutionaryRelation)) === null || _b === void 0 ? void 0 : _b.play(thisPlayerName, otherPlayerName, thisPlayerTotalInformationState, this.modelConfig));
            }
            else {
                yield ((_c = actions_1.actionIllocutionaryRelationMap
                    .get(models_1.IllocutionaryRelation.INITIATING_SPEECH)) === null || _c === void 0 ? void 0 : _c.play(thisPlayerName, otherPlayerName, thisPlayerTotalInformationState, this.modelConfig));
            }
        });
    }
    identifyMoveWithOtherUtterance(thisPlayerName, otherPlayerName, otherPlayerUtterance, discourse) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new actions_1.IdentifyMoveWithOtherUtteranceAction().play(thisPlayerName, otherPlayerName, otherPlayerUtterance, discourse, this.modelConfig);
        });
    }
    resolveDiscourseUnderDiscussion(totalInformationState) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!totalInformationState.privateInformationState) {
                throw new Error("Private Information State can't be null");
            }
            const resolver = new actions_1.ResolveDiscourseGameAction();
            const maxRetries = 1;
            let retryCount = 0;
            let success = false;
            while (!success && retryCount <= maxRetries) {
                try {
                    yield resolver.play(totalInformationState, this.modelConfig);
                    success = true;
                }
                catch (error) {
                    console.error("Error resolving discourse:", error);
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        console.log(`Retrying... (Attempt ${retryCount + 1})`);
                    }
                    else {
                        console.error("Maximum retries reached. Discourse resolution failed.");
                        throw error;
                    }
                }
            }
        });
    }
}
exports.TurnTaker = TurnTaker;
const throwError = (message) => {
    throw new Error(message);
};
