import { genkit } from "genkit";
import { vertexAI } from "@genkit-ai/google-genai";
import { registerFlows } from "@interlocution/flows";
import { startLanguageGameServer } from "./server";

const ai = genkit({
    plugins: [
        vertexAI({
            location: "us-central1",
        }),
    ],
    promptDir: "./prompts",
});

const flows = registerFlows(ai);
startLanguageGameServer(flows);
