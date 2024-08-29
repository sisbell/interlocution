import * as z from "zod";

// Enumerations
export enum IllocutionaryRelation {
    ASK = "ASK",
    ASK_INFLUENCE = "ASK_INFLUENCE",
    ACCEPT = "ACCEPT",
    ASSERT = "ASSERT",
    CHECK = "CHECK",
    CONFIRM = "CONFIRM",
    DENY = "DENY",
    ENGAGE = "ENGAGE",
    DISENGAGE = "DISENGAGE",
    INITIATING_SPEECH = "INITIATING_SPEECH",
}

// Basic Data Models
export const Fact = z.object({
    proposition: z.string(),
    discourseEntryIndex: z.number(),
});

export const DiscourseEntry = z.object({
    id: z.number(),
    tag: z.string(),
    proposition: z.string(),
    linkedId: z.number().optional(),
    speaker: z.string(),
    addressee: z.string(),
});

export const DiscoursePool = z.object({
    entries: z.record(z.string(), DiscourseEntry),
});

export const ActiveDiscourse = z.object({
    entryIds: z.array(z.number())
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
export const Gameboard = z.object({
    name: z.string(),
    moves: z.array(IllocutionaryProposition).optional(),
    discoursePool: DiscoursePool.optional(),
    activeDiscourse: ActiveDiscourse.optional(),
    resolvedDiscourses: z.array(z.string()).optional(),
    facts: z.array(Fact).optional(),
});

export const PrivateInformationState = z.object({
    genre: z.string(),
    goals: z.string(),
    beliefs: z.string().optional(),
    agenda: z.array(z.string()).optional(),
});

export const TotalInformationState = z.object({
    dialogGameboard: Gameboard,
    privateInformationState: PrivateInformationState,
});

export const Player = z.object({
    playerId: z.string().optional(),
    name: z.string(),
    totalInformationState: TotalInformationState,
});

export const ModelConfig = z.object({modelName: z.string()});

// Input/Output Schemas for Flows
export const multiPlayerGameInput = z.object({
    modelConfig: ModelConfig,
    gameboardSetup: z.object({
        rounds: z.number().refine((rounds) => rounds >= 1, {
            message: "At least one round is required.",
        }),
        doGreeting: z.boolean().default(false),
        players: z.array(Player).refine((players) => players.length === 2, {
            message: "Exactly two players are required.",
        }),
    }),
});

export const multiPlayerGameOutput = z.object({
    totalInformationStates: z.array(
        z.object({
            playerName: z.string(),
            totalInformationState: TotalInformationState,
        }),
    ),
});

export const onePlayerGameInput = z.object({
    modelConfig: ModelConfig,
    otherPlayerName: z.string(),
    otherPlayerUtterance: z.string(),
    thisPlayer: Player,
});

export const onePlayerGameOutput = z.object({
    playerName: z.string(),
    playerUtterance: z.string(),
    totalInformationState: TotalInformationState,
});


// Type Exports
export type DiscourseEntryType = z.infer<typeof DiscourseEntry>;
export type FactType = z.infer<typeof Fact>;
export type GameboardType = z.infer<typeof Gameboard>;
export type IllocutionaryPropositionType = z.infer<
    typeof IllocutionaryProposition
>;
export type ModelConfigType = z.infer<typeof ModelConfig>;
export type MultiPlayerGameOutputType = z.infer<typeof multiPlayerGameOutput>;
export type OnePlayerGameInputType = z.infer<typeof onePlayerGameInput>;
export type OnePlayerGameOutputType = z.infer<typeof onePlayerGameOutput>;
export type PlayerType = z.infer<typeof Player>;
export type PrivateInformationStateType = z.infer<
    typeof PrivateInformationState
>
export type TotalInformationStateType = z.infer<typeof TotalInformationState>;

