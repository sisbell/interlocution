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
exports.actionIllocutionaryRelationMap = exports.GeneralGameAction = exports.ResolveDiscourseGameAction = exports.IdentifyMoveWithOtherUtteranceAction = void 0;
const dotprompt_1 = require("@genkit-ai/dotprompt");
const models_1 = require("./models");
class IdentifyMoveWithOtherUtteranceAction {
    play(currentPlayerName, otherPlayerName, otherPlayerUtterance, discourse, modelConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const promptTemplate = yield (0, dotprompt_1.prompt)("identify_utterance");
            const generatedResponse = yield promptTemplate.generate({
                model: modelConfig.modelName,
                input: {
                    utterance: otherPlayerUtterance,
                    discourse: discourse,
                },
            });
            const content = extractAndCleanJson(generatedResponse.text());
            const illocutionaryRelation = (_a = content === null || content === void 0 ? void 0 : content.move) === null || _a === void 0 ? void 0 : _a.toUpperCase();
            return {
                illocutionaryRelation: illocutionaryRelation,
                speaker: otherPlayerName,
                addressee: currentPlayerName,
                utterance: otherPlayerUtterance,
                meaning: content.meaning,
            };
        });
    }
}
exports.IdentifyMoveWithOtherUtteranceAction = IdentifyMoveWithOtherUtteranceAction;
class ResolveDiscourseGameAction {
    play(playerTotalInformationState, modelConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!playerTotalInformationState.privateInformationState) {
                throw new Error("Private Information State can't be null");
            }
            const currentPlayerGameboard = playerTotalInformationState.dgb;
            const promptTemplate = yield (0, dotprompt_1.prompt)("resolve_discourse");
            const promptInputFields = createPromptInputFields(playerTotalInformationState, ["discourse", "facts"]);
            const generatedResponse = yield promptTemplate.generate({
                model: modelConfig.modelName,
                input: promptInputFields,
            });
            const responseJson = extractAndCleanJson(generatedResponse.text());
            for (const fact of responseJson.facts) {
                const f = {
                    proposition: fact.proposition,
                    discourseEntryIndex: fact.resolvedId,
                };
                currentPlayerGameboard.addFact(f);
            }
            const resolvedIds = responseJson.resolvedIds;
            console.log(`resolvedId: ${resolvedIds}`);
            currentPlayerGameboard.updateActiveEntries(resolvedIds);
        });
    }
}
exports.ResolveDiscourseGameAction = ResolveDiscourseGameAction;
class GeneralGameAction {
    constructor(promptName, fields) {
        this.fields = [];
        this.promptName = "";
        this.fields = fields;
        this.promptName = promptName;
    }
    play(currentPlayerName, otherPlayerName, currentPlayerTotalInformationState, modelConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Action: ${this.promptName} for ${currentPlayerName}`);
            if (!currentPlayerTotalInformationState.privateInformationState) {
                throw new Error("Private Information State can't be null");
            }
            const promptTemplate = yield (0, dotprompt_1.prompt)(this.promptName);
            const promptInputFields = createPromptInputFields(currentPlayerTotalInformationState, this.fields);
            console.log(`${this.promptName} Fields - ${JSON.stringify(promptInputFields)}`);
            const generatedResponse = yield promptTemplate.generate({
                model: modelConfig.modelName,
                input: promptInputFields,
            });
            const content = extractAndCleanJson(generatedResponse.text());
            const illocutionaryRelation = models_1.IllocutionaryRelation[content.move];
            const playerMove = {
                illocutionaryRelation: illocutionaryRelation,
                speaker: currentPlayerName,
                addressee: otherPlayerName,
                utterance: content.utterance,
                meaning: content.meaning,
            };
            currentPlayerTotalInformationState.dgb.playLatestMove(playerMove);
        });
    }
}
exports.GeneralGameAction = GeneralGameAction;
exports.actionIllocutionaryRelationMap = new Map([
    [
        models_1.IllocutionaryRelation.ASK,
        new GeneralGameAction("ask", ["discourse", "beliefs", "utterance"]),
    ],
    [
        models_1.IllocutionaryRelation.ASK_INFLUENCE,
        new GeneralGameAction("ask", ["discourse", "beliefs", "utterance"]),
    ],
    [
        models_1.IllocutionaryRelation.ACCEPT,
        new GeneralGameAction("accept", [
            "discourse",
            "beliefs",
            "facts",
            "goals",
            "utterance",
        ]),
    ],
    [
        models_1.IllocutionaryRelation.ASSERT,
        new GeneralGameAction("assert", ["discourse", "beliefs", "utterance"]),
    ],
    [
        models_1.IllocutionaryRelation.CHECK,
        new GeneralGameAction("check", ["discourse", "beliefs", "utterance"]),
    ],
    // [IllocutionaryRelation.CONFIRM, new CounterGreetAction()],
    [
        models_1.IllocutionaryRelation.INITIATING_SPEECH,
        new GeneralGameAction("initiating_speech", [
            "discourse",
            "goals",
            "facts",
        ]),
    ],
]);
const extractAndCleanJson = (input) => {
    const match = input.replace(/\n/g, "").match(/.*?({.*}).*/);
    if (!match)
        return null;
    try {
        return JSON.parse(match[1]);
    }
    catch (error) {
        console.error("Failed to parse JSON:", error);
        return null;
    }
};
const createPromptInputFields = (totalInformationState, fields) => {
    const gameboard = totalInformationState.dgb;
    const privateInformationState = totalInformationState.privateInformationState;
    if (!privateInformationState) {
        throw new Error("Private Information State can't be null");
    }
    const input = {};
    for (const field of fields) {
        switch (field) {
            case "discourse":
                input.discourse = (gameboard === null || gameboard === void 0 ? void 0 : gameboard.getDiscourseAsString()) || "N/A";
                break;
            case "beliefs":
                input.beliefs = privateInformationState.beliefs;
                break;
            case "facts":
                input.facts = (gameboard === null || gameboard === void 0 ? void 0 : gameboard.getFactsAsString()) || "N/A";
                break;
            case "goals":
                input.goals = privateInformationState.goals;
                break;
            case "utterance":
                const latestMove = gameboard === null || gameboard === void 0 ? void 0 : gameboard.getLatestMove();
                if (latestMove) {
                    input.utterance = latestMove.utterance || "";
                }
                break;
        }
    }
    return input;
};
