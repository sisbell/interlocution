import {DialogTIS} from "./information_state";
import type {Genkit} from "genkit";
import {
    Fact,
    IllocutionaryProposition,
    IllocutionaryRelation,
    ModelConfig,
    PlanInfo,
    PrivateInformationState,
} from "./models";


export interface GameAction {
    play(
        currentPlayerName: string,
        otherPlayerName: string,
        currentPlayerTotalInformationState: DialogTIS,
        modelConfig: ModelConfig,
    ): any;
}

export type PromptInputField =
    | "discourse"
    | "discourseFull"
    | "beliefs"
    | "facts"
    | "goals"
    | "planInfo"
    | "utterance";

interface PlayerGameBoardInput {
    discourseFull?: string;
    discourse?: string;
    beliefs?: string;
    facts?: string;
    goals?: string;
    utterance?: string;
    plan?: string;
    planReason?: string;
    planStage?: string
}

export class IdentifyMoveWithOtherUtteranceAction {
    private ai: Genkit;

    constructor(ai: Genkit) {
        this.ai = ai;
    }

    async play(
        currentPlayerName: string,
        otherPlayerName: string,
        otherPlayerUtterance: string,
        discourse: string,
        modelConfig: ModelConfig,
    ): Promise<IllocutionaryProposition> {
        const promptTemplate = await this.ai.prompt("identify_utterance");
        const generatedResponse = await promptTemplate(
            {
                utterance: otherPlayerUtterance,
                discourse: discourse,
            },
            { model: modelConfig.modelName },
        );
        const content = extractAndCleanJson(generatedResponse.text);
        const illocutionaryRelation = content?.move?.toUpperCase();
        return {
            illocutionaryRelation: illocutionaryRelation,
            speaker: otherPlayerName,
            addressee: currentPlayerName,
            utterance: otherPlayerUtterance,
            meaning: content.meaning,
            role: "user"
        };
    }
}

export class ResolveDiscourseGameAction {
    private ai: Genkit;

    constructor(ai: Genkit) {
        this.ai = ai;
    }

    async play(
        playerTotalInformationState: DialogTIS,
        modelConfig: ModelConfig,
    ): Promise<void> {
        if (!playerTotalInformationState.privateInformationState) {
            throw new Error("Private Information State can't be null");
        }
        const currentPlayerGameBoard = playerTotalInformationState.dgb;
        const promptTemplate = await this.ai.prompt("resolve_discourse");
        const promptInputFields = createPromptInputFields(
            playerTotalInformationState,
            ["discourseFull", "facts", "planInfo"],
        );
        const generatedResponse = await promptTemplate(
            promptInputFields,
            { model: modelConfig.modelName },
        );

        const responseJson = extractAndCleanJson(generatedResponse.text);
        for (const fact of responseJson.facts) {
            const f: Fact = {
                proposition: fact.proposition,
                discourseEntryIndex: fact.resolvedId,
            };
            currentPlayerGameBoard.addFact(f);
        }
        if (responseJson.reason) {
            currentPlayerGameBoard.addResolvedDiscourses(responseJson.reason)
        }
        const resolvedIds = responseJson.resolvedIds;
        console.log(`resolvedId: ${resolvedIds}`);
        currentPlayerGameBoard.updateActiveEntries(resolvedIds);
    }
}

export class MakePlanGameAction {
    private ai: Genkit;

    constructor(ai: Genkit) {
        this.ai = ai;
    }

    async play(
        privateInformationState: PrivateInformationState,
        modelConfig: ModelConfig,
    ): Promise<PlanInfo> {
        const promptTemplate = await this.ai.prompt("make_plan");
        const promptInputFields = {
            goals: privateInformationState.goals,
            beliefs: privateInformationState.beliefs,
        }
        const generatedResponse = await promptTemplate(
            promptInputFields,
            { model: modelConfig.modelName },
        );
        return {
            plan: generatedResponse.text
        };
    }
}

export class GeneralGameAction implements GameAction {
    fields: PromptInputField[] = [];
    promptName: string = "";
    private ai: Genkit;

    constructor(ai: Genkit, promptName: string, fields: PromptInputField[]) {
        this.ai = ai;
        this.fields = fields;
        this.promptName = promptName;
    }

    async play(
        currentPlayerName: string,
        otherPlayerName: string,
        currentPlayerTotalInformationState: DialogTIS,
        modelConfig: ModelConfig,
    ): Promise<void> {
        console.log(`Action: ${this.promptName} for ${currentPlayerName}`);
        if (!currentPlayerTotalInformationState.privateInformationState) {
            throw new Error("Private Information State can't be null");
        }
        const promptTemplate = await this.ai.prompt(this.promptName);
        const promptInputFields = createPromptInputFields(
            currentPlayerTotalInformationState,
            this.fields,
        );
        console.log(
            `${this.promptName} Fields - ${JSON.stringify(promptInputFields)}`,
        );
        const generatedResponse = await promptTemplate(
            promptInputFields,
            { model: modelConfig.modelName },
        );

        const content = extractAndCleanJson(generatedResponse.text);
        const illocutionaryRelation =
            IllocutionaryRelation[
                content.move as keyof typeof IllocutionaryRelation
                ];

        const playerMove: IllocutionaryProposition = {
            illocutionaryRelation: illocutionaryRelation,
            speaker: currentPlayerName,
            addressee: otherPlayerName,
            utterance: content.utterance,
            meaning: content.meaning,
            planStage: content.planStage,
            planReason: content.planReason,
            role: "model"
        };

        currentPlayerTotalInformationState.dgb.playLatestMove(playerMove);
    }
}

export function createActionMap(ai: Genkit): Map<IllocutionaryRelation, GameAction> {
    return new Map([
        [
            IllocutionaryRelation.ASK,
            new GeneralGameAction(ai, "ask", ["discourse", "beliefs", "planInfo"]),
        ],
        [
            IllocutionaryRelation.ASK_INFLUENCE,
            new GeneralGameAction(ai, "ask", ["discourse", "beliefs", "planInfo"]),
        ],
        [
            IllocutionaryRelation.ACCEPT,
            new GeneralGameAction(ai, "accept", [
                "discourse",
                "beliefs",
                "facts",
                "planInfo"
            ]),
        ],
        [
            IllocutionaryRelation.ASSERT,
            new GeneralGameAction(ai, "assert", ["discourse", "beliefs", "planInfo"]),
        ],
        [
            IllocutionaryRelation.CHECK,
            new GeneralGameAction(ai, "check", ["discourse", "beliefs", "planInfo"]),
        ],
        [
            IllocutionaryRelation.CONFIRM,
            new GeneralGameAction(ai, "confirm", [
                "discourse",
                "planInfo",
                "beliefs",
            ]),
        ],
        [
            IllocutionaryRelation.COUNTER_PARTING,
            new GeneralGameAction(ai, "ask", ["discourse", "beliefs", "planInfo"]),
        ],
        [
            IllocutionaryRelation.DENY,
            new GeneralGameAction(ai, "deny", [
                "discourse",
                "planInfo",
                "beliefs",
            ]),
        ],
        [
            IllocutionaryRelation.INITIATING_SPEECH,
            new GeneralGameAction(ai, "initiating_speech", [
                "discourse",
                "planInfo",
                "facts",
            ]),
        ],
    ]);
}

const extractAndCleanJson = (input: string): any | null => {
    const match = input.replace(/\n/g, "").match(/.*?({.*}).*/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        return null;
    }
};

const createPromptInputFields = (
    totalInformationState: DialogTIS,
    fields: string[],
): PlayerGameBoardInput => {
    const gameBoard = totalInformationState.dgb;
    const privateInformationState =
        totalInformationState.privateInformationState;
    if (!privateInformationState) {
        throw new Error("Private Information State can't be null");
    }
    const input: PlayerGameBoardInput = {};
    for (const field of fields) {
        switch (field) {
            case "discourseFull":
                input.discourseFull = gameBoard?.getDiscourseAsStringFull() || "N/A";
                break;
            case "discourse":
                input.discourse = gameBoard?.getDiscourseAsStringCondensed() || "N/A";
                break;
            case "beliefs":
                input.beliefs = privateInformationState.beliefs;
                break;
            case "facts":
                input.facts = gameBoard?.getFactsAsString() || "N/A";
                break;
            case "goals":
                input.goals = privateInformationState.goals;
                break;
            case "planInfo":
                input.plan = privateInformationState.planInfo!.plan;
                input.planReason = privateInformationState.planInfo!.reason;
                input.planStage = privateInformationState.planInfo!.stage;
                break;
            case "utterance":
                const latestMove = gameBoard?.getLatestMove();
                if (latestMove) {
                    input.utterance = latestMove.utterance || "";
                }
                break;
        }
    }
    return input;
};
