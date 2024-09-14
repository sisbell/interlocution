import {
    IllocutionaryProposition,
    IllocutionaryRelation,
    ModelConfig,
    MultiPlayerGameOutput,
    OnePlayerGameOutput,
    Player,
    TotalInformationState
} from "./models";
import {DialogGameBoard, DialogPIS, DialogTIS} from "./information_state";
import {
    actionIllocutionaryRelationMap,
    IdentifyMoveWithOtherUtteranceAction,
    ResolveDiscourseGameAction,
} from "./actions";
import {z} from "zod";

export class LanguageGameController {
    private twoPlayerController: TwoPlayerController;

    constructor(twoPlayerController: TwoPlayerController) {
        this.twoPlayerController = twoPlayerController;
    }

    async playGame() {
        while (!this.twoPlayerController.isGameOver()) {
            await this.twoPlayerController.runRound();
        }
        return this.twoPlayerController.getGameResults();
    }
}

export class PlayerController {
    turnTaker: TurnTaker;

    constructor(turnTaker: TurnTaker) {
        this.turnTaker = turnTaker;
    }

    async resolveDiscourseUnderDiscussion(
        thisPlayerTotalInformationState: DialogTIS,
        playerMove?: IllocutionaryProposition,
    ) {
        await this.turnTaker.resolveDiscourseUnderDiscussion(
            thisPlayerTotalInformationState,
        );

        if (
            playerMove?.illocutionaryRelation === IllocutionaryRelation.ACCEPT ||
            playerMove?.illocutionaryRelation === IllocutionaryRelation.CONFIRM
        ) {

        }
    }
}

export class TwoPlayerController extends PlayerController {
    readonly dialogStates: Map<string, DialogTIS>;
    readonly rounds: number;
    private currentRound = 0;
    private players: Player[];

    constructor(players: Player[], turnTaker: TurnTaker, rounds: number) {
        super(turnTaker);
        this.players = players;
        this.rounds = rounds;
        this.dialogStates = TwoPlayerController.initializeDialogStates(players);
    }

    private static initializeDialogStates = (
        players: Player[],
    ): Map<string, DialogTIS> =>
        players.reduce(
            (map, player) =>
                map.set(
                    player.name,
                    new DialogTIS(
                        new DialogGameBoard(
                            player.totalInformationState.dialogGameBoard,
                        ),
                        new DialogPIS(
                            player.totalInformationState.privateInformationState,
                        ),
                    ),
                ),
            new Map(),
        );

    private static statesToArray = (
        totalInformationStates: Map<string, DialogTIS>,
    ): {
        playerName: string;
        totalInformationState: TotalInformationState;
    }[] =>
        Array.from(totalInformationStates.entries()).map(
            ([playerName, totalInformationState]) => ({
                playerName,
                totalInformationState: totalInformationState.toJson(),
            }),
        );

    async runRound() {
        const [playerName1, playerName2] = this.players.map(
            (player) => player.name,
        );
        const playerTotalInformationState1 =
            this.getTotalInformationStateForPlayer(playerName1);
        const playerTotalInformationState2 =
            this.getTotalInformationStateForPlayer(playerName2);
        await this.executeTurn(
            playerName1,
            playerName2,
            playerTotalInformationState1,
            playerTotalInformationState2,
        );
        await this.executeTurn(
            playerName2,
            playerName1,
            playerTotalInformationState2,
            playerTotalInformationState1,
        );

        this.currentRound++;
    }

    isGameOver() {
        return this.currentRound >= this.rounds;
    }

    getGameResults(): z.infer<typeof MultiPlayerGameOutput> {
        return {
            totalInformationStates: TwoPlayerController.statesToArray(
                this.dialogStates,
            ),
        };
    }

    private getTotalInformationStateForPlayer(playerName: string): DialogTIS {
        return (
            this.dialogStates.get(playerName) ??
            throwError("Missing total information state for " + playerName)
        );
    }

    private async executeTurn(
        thisPlayerName: string,
        otherPlayerName: string,
        thisPlayerTotalInformationState: DialogTIS,
        otherPlayerTotalInformationState: DialogTIS,
    ) {
        if (!thisPlayerTotalInformationState.privateInformationState) {
            throw new Error("This Private Information State can't be null");
        }
        if (!otherPlayerTotalInformationState.privateInformationState) {
            throw new Error("Other Private Information State can't be null");
        }
        if (
            otherPlayerTotalInformationState.dgb &&
            otherPlayerTotalInformationState.dgb.moves &&
            otherPlayerTotalInformationState.dgb.moves.length !== 0
        ) {
            const otherPlayUtterance =
                otherPlayerTotalInformationState.dgb?.getLatestMove()
                    ?.utterance ?? "";
            const discourse =
                thisPlayerTotalInformationState.dgb.getDiscourseAsStringCondensed();
            const otherPlayerMove =
                await this.turnTaker.identifyMoveWithOtherUtterance(
                    thisPlayerName,
                    otherPlayerName,
                    otherPlayUtterance,
                    discourse,
                );
            thisPlayerTotalInformationState.dgb.playLatestMove(otherPlayerMove);
            await this.resolveDiscourseUnderDiscussion(
                thisPlayerTotalInformationState,
                otherPlayerMove,
            );
            console.log(`ExecuteTurn - Other Player: ${otherPlayerMove}`);
        }
        await this.turnTaker.takeTurn(
            thisPlayerName,
            otherPlayerName,
            thisPlayerTotalInformationState,
        );
        const thisPlayerMove =
            thisPlayerTotalInformationState.dgb.getLatestMove();
        await this.resolveDiscourseUnderDiscussion(
            thisPlayerTotalInformationState,
            thisPlayerMove,
        );
    }
}

export class OnePlayerController extends PlayerController {
    readonly thisPlayerTotalInformationState: DialogTIS;
    private thisPlayer: Player;

    constructor(thisPlayer: Player, turnTaker: TurnTaker) {
        super(turnTaker);
        this.thisPlayer = thisPlayer;
        this.thisPlayerTotalInformationState = new DialogTIS(
            new DialogGameBoard(
                thisPlayer.totalInformationState.dialogGameBoard,
            ),
            new DialogPIS(
                thisPlayer.totalInformationState.privateInformationState,
            ),
        );
    }

    async runTurn(otherPlayerName: string, otherPlayerUtterance: string) {
        if (!this.thisPlayerTotalInformationState.privateInformationState) {
            throw new Error("This Private Information State can't be null");
        }
        const discourse =
            this.thisPlayerTotalInformationState.dgb.getDiscourseAsStringCondensed();
        if (otherPlayerUtterance && otherPlayerUtterance !== "") {
            const otherPlayerMove =
                await this.turnTaker.identifyMoveWithOtherUtterance(
                    this.thisPlayer.name,
                    otherPlayerName,
                    otherPlayerUtterance,
                    discourse,
                );
            this.thisPlayerTotalInformationState.dgb.playLatestMove(
                otherPlayerMove,
            );
            await this.resolveDiscourseUnderDiscussion(
                this.thisPlayerTotalInformationState,
                otherPlayerMove,
            );
            console.log(`ExecuteTurn - Other Player: ${otherPlayerMove}`);
        }

        await this.turnTaker.takeTurn(
            this.thisPlayer.name,
            otherPlayerName,
            this.thisPlayerTotalInformationState,
        );

        const thisPlayerMove =
            this.thisPlayerTotalInformationState.dgb.getLatestMove();
        await this.resolveDiscourseUnderDiscussion(
            this.thisPlayerTotalInformationState,
            thisPlayerMove,
        );
    }

    getGameResults(): z.infer<typeof OnePlayerGameOutput> {
        return {
            playerName: this.thisPlayer.name,
            playerUtterance:
                this.thisPlayerTotalInformationState.dgb.getLatestMove()
                    ?.utterance || "N/A",
            totalInformationState: this.thisPlayerTotalInformationState.toJson(),
        };
    }
}

export class TurnTaker {
    readonly modelConfig: ModelConfig;

    constructor(modelConfig: ModelConfig) {
        this.modelConfig = modelConfig;
    }

    async takeTurn(
        thisPlayerName: string,
        otherPlayerName: string,
        thisPlayerTotalInformationState: DialogTIS,
    ) {
        console.log(`Starting turn for player: ${thisPlayerName}`);
        if (!thisPlayerTotalInformationState.privateInformationState) {
            throw new Error("Private Information State can't be null");
        }
        const latestMove = thisPlayerTotalInformationState.dgb?.getLatestMove();
        const illocutionaryRelation = latestMove?.illocutionaryRelation;
        if (illocutionaryRelation) {
            await actionIllocutionaryRelationMap
                .get(illocutionaryRelation)
                ?.play(
                    thisPlayerName,
                    otherPlayerName,
                    thisPlayerTotalInformationState,
                    this.modelConfig,
                );
        } else {
            await actionIllocutionaryRelationMap
                .get(IllocutionaryRelation.INITIATING_SPEECH)
                ?.play(
                    thisPlayerName,
                    otherPlayerName,
                    thisPlayerTotalInformationState,
                    this.modelConfig,
                );
        }
    }

    async identifyMoveWithOtherUtterance(
        thisPlayerName: string,
        otherPlayerName: string,
        otherPlayerUtterance: string,
        discourse: string,
    ): Promise<IllocutionaryProposition> {
        return await new IdentifyMoveWithOtherUtteranceAction().play(
            thisPlayerName,
            otherPlayerName,
            otherPlayerUtterance,
            discourse,
            this.modelConfig,
        );
    }

    async resolveDiscourseUnderDiscussion(
        totalInformationState: DialogTIS,
    ): Promise<void> {
        if (!totalInformationState.privateInformationState) {
            throw new Error("Private Information State can't be null");
        }
        const resolver = new ResolveDiscourseGameAction();
        const maxRetries = 1;
        let retryCount = 0;
        let success = false;

        while (!success && retryCount <= maxRetries) {
            try {
                await resolver.play(totalInformationState, this.modelConfig);
                success = true;
            } catch (error) {
                console.error("Error resolving discourse:", error);
                retryCount++;

                if (retryCount <= maxRetries) {
                    console.log(`Retrying... (Attempt ${retryCount + 1})`);
                } else {
                    console.error(
                        "Maximum retries reached. Discourse resolution failed.",
                    );
                    throw error;
                }
            }
        }
    }
}

const throwError = (message: string): never => {
    throw new Error(message);
};
