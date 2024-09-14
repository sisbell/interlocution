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
    COUNTER_PARTING = "COUNTER_PARTING",
}

// Basic Data Models
const Fact = z.object({
    proposition: z.string(),
    discourseEntryIndex: z.number(),
});

const DiscourseEntry = z.object({
    id: z.number(),
    tag: z.string(),
    proposition: z.string(),
    linkedId: z.number().optional(),
    speaker: z.string(),
    addressee: z.string(),
    role: z.string(),
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
    role: z.string(),
    utterance: z.string().optional(),
    meaning: z.string().optional(),
    planStage: z.string().optional(),
    planReason: z.string().optional(),
    discourseEntryId: z.number().optional(),
});

// Composite Data Models
export const GameBoard = z.object({
    name: z.string(),
    moves: z.array(IllocutionaryProposition).optional(),
    discoursePool: DiscoursePool.optional(),
    activeDiscourse: ActiveDiscourse.optional(),
    resolvedDiscourses: z.array(z.string()).optional(),
    facts: z.array(Fact).optional(),
});

const PlanInfo = z.object({
    plan: z.string(),
    stage: z.string().optional(),
    reason: z.string().optional(),
    agenda: z.array(z.string()).optional(),
})

export const PrivateInformationState = z.object({
    genre: z.string(),
    goals: z.string(),
    planInfo: PlanInfo.optional(),
    beliefs: z.string().optional(),
});

export const TotalInformationState = z.object({
    dialogGameBoard: GameBoard,
    privateInformationState: PrivateInformationState,
});

export const Player = z.object({
    playerId: z.string().optional(),
    name: z.string(),
    totalInformationState: TotalInformationState,
});

const ModelConfig = z.object({modelName: z.string()});

// Input/Output Schemas for Flows
export const CreatePlanInput = z.object({
    modelConfig: ModelConfig,
    privateInformationState: PrivateInformationState,
});

export const OnePlayerGameInput = z.object({
    modelConfig: ModelConfig,
    otherPlayerName: z.string(),
    otherPlayerUtterance: z.string(),
    thisPlayer: Player,
});

export const OnePlayerGameOutput = z.object({
    playerName: z.string(),
    playerUtterance: z.string(),
    totalInformationState: TotalInformationState,
});

export const MultiPlayerGameInput = z.object({
    modelConfig: ModelConfig,
    gameBoardSetup: z.object({
        rounds: z.number().refine((rounds) => rounds >= 1, {
            message: "At least one round is required.",
        }),
        doGreeting: z.boolean().default(false),
        players: z.array(Player).refine((players) => players.length === 2, {
            message: "Exactly two players are required.",
        }),
    }),
});

export const MultiPlayerGameOutput = z.object({
    totalInformationStates: z.array(
        z.object({
            playerName: z.string(),
            totalInformationState: TotalInformationState,
        }),
    ),
});

// Type Exports
export type CreatePlanInput = z.infer<typeof CreatePlanInput>;
export type DiscourseEntry = z.infer<typeof DiscourseEntry>;
export type Fact = z.infer<typeof Fact>;
export type GameBoard = z.infer<typeof GameBoard>;
export type IllocutionaryProposition = z.infer<
    typeof IllocutionaryProposition
>;
export type ModelConfig = z.infer<typeof ModelConfig>;
export type PlanInfo = z.infer<typeof PlanInfo>;
export type Player = z.infer<typeof Player>;
export type PrivateInformationState = z.infer<
    typeof PrivateInformationState
>
export type TotalInformationState = z.infer<typeof TotalInformationState>;

