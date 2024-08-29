import {DialogTIS} from "./information_state";
import {prompt} from "@genkit-ai/dotprompt";
import {FactType, IllocutionaryPropositionType, IllocutionaryRelation, ModelConfigType,} from "./models";


export interface GameAction {
    play(
        currentPlayerName: string,
        otherPlayerName: string,
        currentPlayerTotalInformationState: DialogTIS,
        modelConfig: ModelConfigType,
    ): any;
}

export type PromptInputField =
    | "discourse"
    | "beliefs"
    | "facts"
    | "goals"
    | "utterance";

interface PlayerGameboardInput {
    discourse?: string;
    beliefs?: string;
    facts?: string;
    goals?: string;
    utterance?: string;
}

export class IdentifyMoveWithOtherUtteranceAction {
    async play(
        currentPlayerName: string,
        otherPlayerName: string,
        otherPlayerUtterance: string,
        discourse: string,
        modelConfig: ModelConfigType,
    ): Promise<IllocutionaryPropositionType> {
        const promptTemplate = await prompt("identify_utterance");
        const generatedResponse = await promptTemplate.generate({
            model: modelConfig.modelName,
            input: {
                utterance: otherPlayerUtterance,
                discourse: discourse,
            },
        });
        const content = extractAndCleanJson(generatedResponse.text());
        const illocutionaryRelation = content?.move?.toUpperCase();
        return {
            illocutionaryRelation: illocutionaryRelation,
            speaker: otherPlayerName,
            addressee: currentPlayerName,
            utterance: otherPlayerUtterance,
            meaning: content.meaning,
        };
    }
}

export class ResolveDiscourseGameAction {
    async play(
        playerTotalInformationState: DialogTIS,
        modelConfig: ModelConfigType,
    ): Promise<void> {
        if (!playerTotalInformationState.privateInformationState) {
            throw new Error("Private Information State can't be null");
        }
        const currentPlayerGameboard = playerTotalInformationState.dgb;
        const promptTemplate = await prompt("resolve_discourse");
        const promptInputFields = createPromptInputFields(
            playerTotalInformationState,
            ["discourse", "facts"],
        );
        const generatedResponse = await promptTemplate.generate({
            model: modelConfig.modelName,
            input: promptInputFields,
        });

        const responseJson = extractAndCleanJson(generatedResponse.text());
        for (const fact of responseJson.facts) {
            const f: FactType = {
                proposition: fact.proposition,
                discourseEntryIndex: fact.resolvedId,
            };
            currentPlayerGameboard.addFact(f);
        }
        if(responseJson.reason) {
            currentPlayerGameboard.addResolvedDiscourses(responseJson.reason)
        }
        const resolvedIds = responseJson.resolvedIds;
        console.log(`resolvedId: ${resolvedIds}`);
        currentPlayerGameboard.updateActiveEntries(resolvedIds);
    }
}

export class GeneralGameAction implements GameAction {
    fields: PromptInputField[] = [];
    promptName: string = "";

    constructor(promptName: string, fields: PromptInputField[]) {
        this.fields = fields;
        this.promptName = promptName;
    }

    async play(
        currentPlayerName: string,
        otherPlayerName: string,
        currentPlayerTotalInformationState: DialogTIS,
        modelConfig: ModelConfigType,
    ): Promise<void> {
        console.log(`Action: ${this.promptName} for ${currentPlayerName}`);
        if (!currentPlayerTotalInformationState.privateInformationState) {
            throw new Error("Private Information State can't be null");
        }
        const promptTemplate = await prompt(this.promptName);
        const promptInputFields = createPromptInputFields(
            currentPlayerTotalInformationState,
            this.fields,
        );
        console.log(
            `${this.promptName} Fields - ${JSON.stringify(promptInputFields)}`,
        );
        const generatedResponse = await promptTemplate.generate({
            model: modelConfig.modelName,
            input: promptInputFields,
        });

        const content = extractAndCleanJson(generatedResponse.text());
        const illocutionaryRelation =
            IllocutionaryRelation[
                content.move as keyof typeof IllocutionaryRelation
                ];

        const playerMove: IllocutionaryPropositionType = {
            illocutionaryRelation: illocutionaryRelation,
            speaker: currentPlayerName,
            addressee: otherPlayerName,
            utterance: content.utterance,
            meaning: content.meaning,
        };

        currentPlayerTotalInformationState.dgb.playLatestMove(playerMove);
    }
}

export const actionIllocutionaryRelationMap: Map<
    IllocutionaryRelation,
    GameAction
> = new Map([
    [
        IllocutionaryRelation.ASK,
        new GeneralGameAction("ask", ["discourse", "beliefs", "utterance"]),
    ],
    [
        IllocutionaryRelation.ASK_INFLUENCE,
        new GeneralGameAction("ask", ["discourse", "beliefs", "utterance"]),
    ],
    [
        IllocutionaryRelation.ACCEPT,
        new GeneralGameAction("accept", [
            "discourse",
            "beliefs",
            "facts",
            "goals",
            "utterance",
        ]),
    ],
    [
        IllocutionaryRelation.ASSERT,
        new GeneralGameAction("assert", ["discourse", "beliefs", "utterance"]),
    ],
    [
        IllocutionaryRelation.CHECK,
        new GeneralGameAction("check", ["discourse", "beliefs", "utterance"]),
    ],
    // [IllocutionaryRelation.CONFIRM, new CounterGreetAction()],
    [
        IllocutionaryRelation.INITIATING_SPEECH,
        new GeneralGameAction("initiating_speech", [
            "discourse",
            "goals",
            "facts",
        ]),
    ],
]);

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
): PlayerGameboardInput => {
    const gameboard = totalInformationState.dgb;
    const privateInformationState =
        totalInformationState.privateInformationState;
    if (!privateInformationState) {
        throw new Error("Private Information State can't be null");
    }
    const input: PlayerGameboardInput = {};
    for (const field of fields) {
        switch (field) {
            case "discourse":
                input.discourse = gameboard?.getDiscourseAsString() || "N/A";
                break;
            case "beliefs":
                input.beliefs = privateInformationState.beliefs;
                break;
            case "facts":
                input.facts = gameboard?.getFactsAsString() || "N/A";
                break;
            case "goals":
                input.goals = privateInformationState.goals;
                break;
            case "utterance":
                const latestMove = gameboard?.getLatestMove();
                if (latestMove) {
                    input.utterance = latestMove.utterance || "";
                }
                break;
        }
    }
    return input;
};
