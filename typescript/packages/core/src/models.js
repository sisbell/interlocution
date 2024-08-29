"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlayerInput = exports.onePlayerGameOutput = exports.onePlayerGameInput = exports.multiPlayerGameOutput = exports.multiPlayerGameInput = exports.ModelConfig = exports.Player = exports.TotalInformationState = exports.PrivateInformationState = exports.Gameboard = exports.ActiveDiscourse = exports.DiscoursePool = exports.DiscourseEntry = exports.Fact = exports.IllocutionaryRelation = void 0;
const z = __importStar(require("zod"));
// Enumerations
var IllocutionaryRelation;
(function (IllocutionaryRelation) {
    IllocutionaryRelation["ASK"] = "ASK";
    IllocutionaryRelation["ASK_INFLUENCE"] = "ASK_INFLUENCE";
    IllocutionaryRelation["ACCEPT"] = "ACCEPT";
    IllocutionaryRelation["ASSERT"] = "ASSERT";
    IllocutionaryRelation["CHECK"] = "CHECK";
    IllocutionaryRelation["CONFIRM"] = "CONFIRM";
    IllocutionaryRelation["DENY"] = "DENY";
    IllocutionaryRelation["ENGAGE"] = "ENGAGE";
    IllocutionaryRelation["DISENGAGE"] = "DISENGAGE";
    IllocutionaryRelation["INITIATING_SPEECH"] = "INITIATING_SPEECH";
})(IllocutionaryRelation || (exports.IllocutionaryRelation = IllocutionaryRelation = {}));
// Basic Data Models
exports.Fact = z.object({
    proposition: z.string(),
    discourseEntryIndex: z.number(),
});
exports.DiscourseEntry = z.object({
    id: z.number(), //pull for gameboard
    tag: z.string(), //moveType + others
    proposition: z.string(),
    linkedId: z.number().optional(),
    speaker: z.string(),
    addressee: z.string(),
});
exports.DiscoursePool = z.object({
    entries: z.record(z.number(), exports.DiscourseEntry),
});
exports.ActiveDiscourse = z.object({
    entryIds: z.array(z.number()),
});
const IllocutionaryProposition = z.object({
    illocutionaryRelation: z.nativeEnum(IllocutionaryRelation),
    speaker: z.string(),
    addressee: z.string(),
    utterance: z.string().optional(),
    meaning: z.string().optional(),
    discourseEntryId: z.number().optional(),
});
// Composite Data Models
exports.Gameboard = z.object({
    name: z.string(),
    moves: z.array(IllocutionaryProposition).optional(),
    discoursePool: exports.DiscoursePool.optional(),
    activeDiscourse: exports.ActiveDiscourse.optional(),
    facts: z.array(exports.Fact).optional(),
});
exports.PrivateInformationState = z.object({
    genre: z.string(),
    goals: z.string(),
    beliefs: z.string().optional(),
    agenda: z.array(z.string()).optional(),
});
exports.TotalInformationState = z.object({
    dialogGameboard: exports.Gameboard,
    privateInformationState: exports.PrivateInformationState,
});
exports.Player = z.object({
    name: z.string(),
    totalInformationState: exports.TotalInformationState,
});
exports.ModelConfig = z.object({ modelName: z.string() });
// Input/Output Schemas for Flows
exports.multiPlayerGameInput = z.object({
    modelConfig: exports.ModelConfig,
    gameboardSetup: z.object({
        rounds: z.number().refine((rounds) => rounds >= 1, {
            message: "At least one round is required.",
        }),
        doGreeting: z.boolean().default(false),
        players: z.array(exports.Player).refine((players) => players.length === 2, {
            message: "Exactly two players are required.",
        }),
    }),
});
exports.multiPlayerGameOutput = z.object({
    totalInformationStates: z.array(z.object({
        playerName: z.string(),
        totalInformationState: exports.TotalInformationState,
    })),
});
exports.onePlayerGameInput = z.object({
    modelConfig: exports.ModelConfig,
    otherPlayerName: z.string(),
    otherPlayerUtterance: z.string(),
    thisPlayer: exports.Player,
});
exports.onePlayerGameOutput = z.object({
    playerName: z.string(),
    playerUtterance: z.string(),
    totalInformationState: exports.TotalInformationState,
});
exports.createPlayerInput = z.object({
    playerKey: z.string(),
    playerName: z.string(),
    privateInformationState: exports.PrivateInformationState,
});
