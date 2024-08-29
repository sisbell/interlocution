import express, {Request, Response} from "express";
import {runFlow} from "@genkit-ai/flow";
import bodyParser from "body-parser";
import {InMemoryPlayerCache, multiPlayerGameFlow, onePlayerGameFlow} from "@interlocution/flows";
import {OnePlayerGameInputType, OnePlayerGameOutputType, PlayerType} from "@interlocution/core/models";
import cors from "cors";

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
    const player: PlayerType = (await playerCache.get(playerId))!;

    const onePlayerGameInputType: OnePlayerGameInputType = {
        modelConfig: {
            modelName: modelName
        },
        otherPlayerName: otherPlayerName,
        otherPlayerUtterance: otherPlayerUtterance,
        thisPlayer: player,
    };
    console.log(JSON.stringify(onePlayerGameInputType));

    const playGameOutput: OnePlayerGameOutputType = await runFlow(onePlayerGameFlow, onePlayerGameInputType);
    console.log(JSON.stringify(playGameOutput));
    const playerResult: PlayerType = {
        name: playGameOutput.playerName,
        totalInformationState: playGameOutput.totalInformationState
    }
    await playerCache.set(playerId, playerResult);
    console.log(playGameOutput);
    res.json(playGameOutput);
});

app.post("/aiplayer/create", async (req: Request, res: Response) => {
    const createPlayerInput: PlayerType = req.body;
    await playerCache.set(createPlayerInput.playerId!, createPlayerInput);
    res.json(createPlayerInput);
});

app.post("/game/multiplay", async (req: Request, res: Response) => {
    const playGameInput = req.body;
    const playGameOutput = await runFlow(multiPlayerGameFlow, playGameInput);
    console.log(playGameOutput);
    res.json(playGameOutput);
});

export function startLanguageGameServer() {
    app.listen(port, () => {
        console.log(`LanguageGame Server running on http://localhost:${port}`);
    });
}
