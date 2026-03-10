import express, {Request, Response} from "express";
import bodyParser from "body-parser";
import {InMemoryPlayerCache} from "@interlocution/flows";
import {OnePlayerGameInput, OnePlayerGameOutput, Player} from "@interlocution/core/models";
import cors from "cors";
import {CreatePlanInput} from "@interlocution/core";
import {z} from "zod";

interface Flows {
    onePlayerGameFlow: (input: z.infer<typeof OnePlayerGameInput>) => Promise<z.infer<typeof OnePlayerGameOutput>>;
    createPlanFlow: (input: CreatePlanInput) => Promise<any>;
    multiPlayerGameFlow: (input: any) => Promise<any>;
}

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

export function startLanguageGameServer(flows: Flows) {
    app.post("/game/play", async (req: Request, res: Response) => {
        const playGameInput = req.body;
        const playerId = playGameInput.playerId;
        const otherPlayerName = playGameInput.name;
        const otherPlayerUtterance = playGameInput.utterance;
        const modelName = playGameInput.modelName ? playGameInput.modelName : "vertexai/gemini-2.0-flash";
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

        const playGameOutput = await flows.onePlayerGameFlow(onePlayerGameInput);
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
                modelName: "vertexai/gemini-2.0-flash",
            }
        }
        privateInformationState.planInfo = await flows.createPlanFlow(createPlanInput);
        await playerCache.set(createPlayerInput.playerId!, createPlayerInput);
        res.json(createPlayerInput);
    });

    app.post("/game/multiplay", async (req: Request, res: Response) => {
        const playGameInput = req.body;
        const playGameOutput = await flows.multiPlayerGameFlow(playGameInput);
        console.log(playGameOutput);
        //TODO: Generate Plans
        res.json(playGameOutput);
    });

    app.listen(port, () => {
        console.log(`LanguageGame Server running on http://localhost:${port}`);
    });
}
