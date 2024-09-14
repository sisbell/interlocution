import express, {Request, Response} from "express";
import {runFlow} from "@genkit-ai/flow";
import bodyParser from "body-parser";
import {createPlanFlow, InMemoryPlayerCache, multiPlayerGameFlow, onePlayerGameFlow} from "@interlocution/flows";
import {OnePlayerGameInput, OnePlayerGameOutput, Player} from "@interlocution/core/models";
import cors from "cors";
import {CreatePlanInput} from "@interlocution/core";
import {z} from "zod";

const enableCorsLocalhost = process.env.CORS_ALL?.toUpperCase() !== 'FALSE';

const app = express();

if (enableCorsLocalhost) {
    app.use(cors());
} else {
    app.use(cors({
        origin: (origin, callback) => {
            const allowedOrigins = ['https://interlocution.ai', 'https://interlocution.ai/'];
            if (origin && allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
    }));
}
const port = 8000;

app.use(bodyParser.json());

const playerCache = new InMemoryPlayerCache();

app.post("/game/play", async (req: Request, res: Response) => {
    const playGameInput = req.body;
    const playerId = playGameInput.playerId;
    const otherPlayerName = playGameInput.name;
    const otherPlayerUtterance = playGameInput.utterance;
    const modelName = playGameInput.modelName ? playGameInput.modelName : "vertexai/gemini-1.5-flash";
    const player: Player = (await playerCache.get(playerId))!;

    const onePlayerGameInput: z.infer<typeof OnePlayerGameInput> = {
        modelConfig: {
            modelName: modelName
        },
        otherPlayerName: otherPlayerName,
        otherPlayerUtterance: otherPlayerUtterance,
        thisPlayer: player,
    };
    console.log(JSON.stringify(onePlayerGameInput));

    const playGameOutput: z.infer<typeof OnePlayerGameOutput> = await runFlow(onePlayerGameFlow, onePlayerGameInput);
    console.log(JSON.stringify(playGameOutput));
    const playerResult: Player = {
        name: playGameOutput.playerName,
        totalInformationState: playGameOutput.totalInformationState
    }
    await playerCache.set(playerId, playerResult);
    console.log(playGameOutput);
    res.json(playGameOutput);
});

app.post("/aiplayer/create", async (req: Request, res: Response) => {
    const createPlayerInput: Player = req.body;
    const privateInformationState = createPlayerInput.totalInformationState.privateInformationState;
    const createPlanInput: CreatePlanInput = {
        privateInformationState: privateInformationState,
        modelConfig: {
            modelName: "vertexai/gemini-1.5-flash",
        }
    }
    privateInformationState.planInfo = await runFlow(createPlanFlow, createPlanInput);
    await playerCache.set(createPlayerInput.playerId!, createPlayerInput);
    res.json(createPlayerInput);
});

app.post("/game/multiplay", async (req: Request, res: Response) => {
    const playGameInput = req.body;
    const playGameOutput = await runFlow(multiPlayerGameFlow, playGameInput);
    console.log(playGameOutput);
    //TODO: Generate Plans
    res.json(playGameOutput);
});

export function startLanguageGameServer() {
    app.listen(port, () => {
        console.log(`LanguageGame Server running on http://localhost:${port}`);
    });
}
