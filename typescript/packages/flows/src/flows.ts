import {defineFlow} from "@genkit-ai/flow";
import {
    MultiPlayerGameInput,
    MultiPlayerGameOutput,
    OnePlayerGameInput,
    OnePlayerGameOutput, PlanInfo
} from "@interlocution/core/models";
import {
    LanguageGameController,
    OnePlayerController,
    TurnTaker,
    TwoPlayerController
} from "@interlocution/core/controllers"
import {CreatePlanInput, MakePlanGameAction} from "@interlocution/core";

export const onePlayerGameFlow = defineFlow(
    {
        name: "onePlayerGameFlow",
        inputSchema: OnePlayerGameInput,
        outputSchema: OnePlayerGameOutput,
    },
    async ({modelConfig, thisPlayer, otherPlayerName, otherPlayerUtterance}) => {
        const turnTaker = new TurnTaker(modelConfig);
        const onePlayerController = new OnePlayerController(thisPlayer, turnTaker)
        await onePlayerController.runTurn(otherPlayerName, otherPlayerUtterance);
        return onePlayerController.getGameResults();
    },
);

export const createPlanFlow = defineFlow(
    {
        name: "createPlanFlow",
        inputSchema: CreatePlanInput,
        outputSchema: PlanInfo
    },
    async ({modelConfig, privateInformationState}) => {
        return await new MakePlanGameAction().play(
            privateInformationState,
            modelConfig,
        );
    },
);

export const multiPlayerGameFlow = defineFlow(
    {
        name: "multiPlayerGameFlow",
        inputSchema: MultiPlayerGameInput,
        outputSchema: MultiPlayerGameOutput,
    },
    async ({gameBoardSetup: gameBoardSetup, modelConfig}) => {
        const {rounds, players} = gameBoardSetup;
        const turnTaker = new TurnTaker(modelConfig);
        const twoPlayerController = new TwoPlayerController(
            players,
            turnTaker,
            rounds,
        );
        const gameController = new LanguageGameController(twoPlayerController);
        return gameController.playGame();
    },
);
