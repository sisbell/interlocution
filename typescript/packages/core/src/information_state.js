"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogPIS = exports.DialogTIS = exports.ActiveDiscourseManager = exports.DialogGameBoard = void 0;
const models_1 = require("./models");
class DialogGameBoard {
    constructor(gameboard) {
        var _a;
        this.facts = (gameboard === null || gameboard === void 0 ? void 0 : gameboard.facts) || [];
        this.moves = (gameboard === null || gameboard === void 0 ? void 0 : gameboard.moves) || [];
        this.activeDiscourseManager = new ActiveDiscourseManager((gameboard === null || gameboard === void 0 ? void 0 : gameboard.discoursePool) || { entries: {} }, ((_a = gameboard === null || gameboard === void 0 ? void 0 : gameboard.activeDiscourse) === null || _a === void 0 ? void 0 : _a.entryIds) || []);
    }
    toJson() {
        return {
            name: "Default",
            moves: this.moves,
            facts: this.facts,
            activeDiscourse: {
                entryIds: this.activeDiscourseManager.getActiveDiscourseEntryIds(),
            },
            discoursePool: this.activeDiscourseManager.getDiscoursePoolAsArray(),
        };
    }
    isFirstTurn() {
        const latestMove = this.getLatestMove();
        return latestMove === undefined || latestMove.utterance === null;
    }
    addFact(fact) {
        this.facts.push(fact);
    }
    getFacts() {
        return this.facts;
    }
    getFactsAsString() {
        return this.facts.map((fact) => fact.proposition).join("\n");
    }
    getLatestMove() {
        return this.moves[this.moves.length - 1];
    }
    getDiscourseAsString() {
        const activeEntries = this.activeDiscourseManager.getActiveDiscourseEntries();
        if (!activeEntries) {
            return "N/A";
        }
        return activeEntries
            .map((entry) => `Speaker: ${entry.speaker}, Move: ${entry.tag}, ID: ${entry.id}, Utterance: ${entry.proposition}`)
            .join("\n");
    }
    hasMoves() {
        return this.moves.length > 0;
    }
    playLatestMove(latestMove) {
        console.log(latestMove);
        const currentDiscourseEntryId = this.activeDiscourseManager.getLastEntryId() + 1;
        latestMove.discourseEntryId = currentDiscourseEntryId;
        this.moves.push(latestMove);
        const discourseEntry = {
            id: currentDiscourseEntryId,
            tag: latestMove.illocutionaryRelation,
            proposition: latestMove.utterance,
            linkedId: latestMove.illocutionaryRelation == models_1.IllocutionaryRelation.ASK
                ? 0
                : currentDiscourseEntryId - 1,
            speaker: latestMove.speaker,
            addressee: latestMove.addressee,
        };
        this.activeDiscourseManager.addEntryToPool(discourseEntry);
        this.activeDiscourseManager.addActiveDiscourseEntry(discourseEntry);
    }
    updateActiveEntries(downdatedIds) {
        this.activeDiscourseManager.updateActiveEntries(downdatedIds);
    }
}
exports.DialogGameBoard = DialogGameBoard;
class ActiveDiscourseManager {
    constructor(initialPool = { entries: {} }, activeDiscourseEntryIds = []) {
        this.activeDiscourseEntryIds = [...activeDiscourseEntryIds];
        this.discoursePool = new Map(Object.entries(initialPool.entries).map(([idString, proposition]) => [
            parseInt(idString, 10),
            proposition,
        ]));
    }
    getActiveDiscourseEntryIds() {
        return this.activeDiscourseEntryIds;
    }
    addActiveDiscourseEntry(discourseEntry) {
        if (this.discoursePool.has(discourseEntry.id)) {
            this.activeDiscourseEntryIds.push(discourseEntry.id);
        }
        else {
            throw new Error("Entry not found in the pool.");
        }
    }
    addEntryToPool(newDiscourseEntry) {
        if (this.discoursePool.has(newDiscourseEntry.id)) {
            throw new Error("Entry ID already exists in the pool.");
        }
        this.discoursePool.set(newDiscourseEntry.id, newDiscourseEntry);
    }
    updateActiveEntries(downdatedIds) {
        const toRemove = new Set(downdatedIds.map((id) => Number(id)));
        this.activeDiscourseEntryIds = this.activeDiscourseEntryIds.filter((num) => !toRemove.has(Number(num)));
    }
    getActiveEntries() {
        return Array.from(this.activeDiscourseEntryIds).map((id) => this.discoursePool.get(id));
    }
    getLastEntryId() {
        const entryIds = Array.from(this.discoursePool.keys());
        return entryIds.length > 0 ? Math.max(...entryIds) : 0;
    }
    getActiveEntryCount() {
        return this.activeDiscourseEntryIds.length;
    }
    getDiscoursePool() {
        return this.discoursePool;
    }
    getDiscoursePoolAsArray() {
        const entries = Object.fromEntries(Array.from(this.discoursePool.entries()).map(([key, value]) => [
            key,
            value,
        ]));
        return { entries };
    }
    getActiveDiscourseEntries() {
        const lastActiveEntryId = this.activeDiscourseEntryIds[this.activeDiscourseEntryIds.length - 1];
        if (!this.discoursePool.has(lastActiveEntryId)) {
            console.log(`getActiveDiscourseEntries null`);
            return null;
        }
        const linkedActiveEntries = [];
        let currentQuestionId = lastActiveEntryId;
        while (currentQuestionId !== undefined) {
            const currentQuestion = this.discoursePool.get(currentQuestionId);
            if (!currentQuestion) {
                console.log(`getActiveDiscourseEntries AAA`);
                console.log(`linkedActiveEntries: ${JSON.stringify(linkedActiveEntries.reverse())}`);
                return linkedActiveEntries;
            }
            console.log(`getActiveDiscourseEntries push question: ${JSON.stringify(currentQuestion)}`);
            linkedActiveEntries.push(currentQuestion);
            currentQuestionId = currentQuestion.linkedId;
        }
        console.log(`linkedActiveEntries: ${JSON.stringify(linkedActiveEntries.reverse())}`);
        return linkedActiveEntries;
    }
}
exports.ActiveDiscourseManager = ActiveDiscourseManager;
class DialogTIS {
    constructor(dgb, privateInformationState) {
        this.dgb = dgb;
        this.privateInformationState = privateInformationState;
    }
    toJson() {
        return {
            privateInformationState: this.privateInformationState.toJson(),
            dialogGameboard: this.dgb.toJson(),
        };
    }
}
exports.DialogTIS = DialogTIS;
class DialogPIS {
    constructor(p) {
        this.genre = p.genre;
        this.goals = p.goals || "";
        this.beliefs = p.beliefs || "";
    }
    toJson() {
        return {
            genre: this.genre,
            goals: this.goals,
            beliefs: this.beliefs,
            agenda: [],
        };
    }
}
exports.DialogPIS = DialogPIS;
