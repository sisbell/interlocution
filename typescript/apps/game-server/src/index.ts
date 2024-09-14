import { configureGenkit } from "@genkit-ai/core";
import { startFlowsServer } from "@genkit-ai/flow";

import { ollama } from "genkitx-ollama";
import { dotprompt } from "@genkit-ai/dotprompt";
import { vertexAI } from "@genkit-ai/vertexai";
import { startLanguageGameServer } from "./server";

configureGenkit({
    plugins: [
        ollama({
            models: [{ name: "gemma" }],
            serverAddress: "http://127.0.0.1:11434",
        }),
        vertexAI({
            location: "us-central1",
            googleAuth: {
                scopes: "https://www.googleapis.com/auth/cloud-platform",
            },
        }),
        dotprompt(),
    ],
    logLevel: "debug",
    enableTracingAndMetrics: true,
});

const shouldStartFlowsServer = process.env.FLOW_SERVER?.toUpperCase() !== 'FALSE';

if (shouldStartFlowsServer) {
  //  startFlowsServer();
}
startLanguageGameServer();
