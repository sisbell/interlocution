import {defineFlow} from "@genkit-ai/flow";
import {
    multiPlayerGameInput,
    onePlayerGameInput,
    multiPlayerGameOutput,
    onePlayerGameOutput
} from "@interlocution/core/models";
import {
    LanguageGameController, OnePlayerController,
    TurnTaker,
    TwoPlayerController
} from "@interlocution/core/controllers"

export const onePlayerGameFlow = defineFlow(
    {
        name: "onePlayerGameFlow",
        inputSchema: onePlayerGameInput,
        outputSchema: onePlayerGameOutput,
    },
    async ({modelConfig, thisPlayer, otherPlayerName, otherPlayerUtterance}) => {
        const turnTaker = new TurnTaker(modelConfig);
        const onePlayerController = new OnePlayerController(thisPlayer, turnTaker)
        await onePlayerController.runTurn(otherPlayerName, otherPlayerUtterance);
        return onePlayerController.getGameResults();
    },
);

export const multiPlayerGameFlow = defineFlow(
    {
        name: "multiPlayerGameFlow",
        inputSchema: multiPlayerGameInput,
        outputSchema: multiPlayerGameOutput,
    },
    async ({gameboardSetup, modelConfig}) => {
        const {rounds, players} = gameboardSetup;
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
