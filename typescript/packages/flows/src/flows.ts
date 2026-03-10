import type {Genkit} from "genkit";
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

export function registerFlows(ai: Genkit) {
    const onePlayerGameFlow = ai.defineFlow(
        {
            name: "onePlayerGameFlow",
            inputSchema: OnePlayerGameInput,
            outputSchema: OnePlayerGameOutput,
        },
        async ({modelConfig, thisPlayer, otherPlayerName, otherPlayerUtterance}) => {
            const turnTaker = new TurnTaker(ai, modelConfig);
            const onePlayerController = new OnePlayerController(thisPlayer, turnTaker)
            await onePlayerController.runTurn(otherPlayerName, otherPlayerUtterance);
            return onePlayerController.getGameResults();
        },
    );

    const createPlanFlow = ai.defineFlow(
        {
            name: "createPlanFlow",
            inputSchema: CreatePlanInput,
            outputSchema: PlanInfo
        },
        async ({modelConfig, privateInformationState}) => {
            return await new MakePlanGameAction(ai).play(
                privateInformationState,
                modelConfig,
            );
        },
    );

    const multiPlayerGameFlow = ai.defineFlow(
        {
            name: "multiPlayerGameFlow",
            inputSchema: MultiPlayerGameInput,
            outputSchema: MultiPlayerGameOutput,
        },
        async ({gameBoardSetup: gameBoardSetup, modelConfig}) => {
            const {rounds, players} = gameBoardSetup;
            const turnTaker = new TurnTaker(ai, modelConfig);
            const twoPlayerController = new TwoPlayerController(
                players,
                turnTaker,
                rounds,
            );
            const gameController = new LanguageGameController(twoPlayerController);
            return gameController.playGame();
        },
    );

    return {onePlayerGameFlow, createPlanFlow, multiPlayerGameFlow};
}
