# Interlocution 
A Research Project Exploring Spoken Conversations with the use of LLMs

https://interlocution.ai/

## Motivation 
Much of the Interlocution code is based on Jonathan Ginzburg's work on Dialog GameBoards and his KoS theory ("The Interactive Stance" 2012), which is a formalization of a Wittgenstein Language Game. Specifically, this project focuses on modeling *spoken* utterances which tend to be non-sentential utterances. Typically chatbots have a hard time with NSUs. The LLM backed ones do better but it is very easy for main questions and discussion points to get lost, making it harder for assistants to go back to the main driving goals.

Waijar ("The importance of single-word utterances for early word recognition", 2001) estimates that 30% of all spoken utterances are non-sentential utterances, meaning they are lacking overt predicates and therefore are highly dependent on the context of the conversation. It is worthwhile to explore a framework to help the LLM define proper dialog state and directed goals within a spoken interaction.

## Present State and Future Work
The current state of the program provides management of dialog states backed by prompts used by LLMs.

The present language features have been implemented
* State management for key states and intentions: Ask, Assert, Check, etc.
* Support for AI Goals
* Support for collecting of facts
* Basic resolving of topics no longer under discussion

The following still needs more research and work
* More advanced options for resolving questions or topics that are no longer under discussion.
* Use of plans and agendas in determining the Genre context, with the ability of adding additional states and prompts to the AI that are specific to that genre.
* Currently the work focuses on information seeking conversations but additional types like persuasion or planning need to be explored.
* Work in grounding and clarifications
* How to engage and disengage from conversations
* Multi-agent support

## Language Game Server
### Building Locally
To run locally, you will need to first build and start the game-server node.js app.

From the typescript directory, build the application and all package dependencies
```shell
./local-build.sh
```

### Setup LLM
If you are using vertexai for the LLM, you can use environment variables to set the project and credentials

```shell
export GOOGLE_APPLICATION_CREDENTIALS=
export GCLOUD_PROJECT=
```

If you are testing with Ollama, you can find instructions below

https://firebase.google.com/docs/genkit/plugins/ollama

If you want to use another LLM, do a search LLMs that are supported with genkit

https://www.npmjs.com/search?q=keywords:genkit-plugin

New plugins will need to be added as a plugin in the game-server index.ts file

```typescript
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
```

### Running
From the typescript/apps/game-server directory, run the following command to start the app locally.
```shell
npm run start
```

## UI for Testing Conversations

### Run
Run the following on the command-line from the flutter-ui directory

```shell
flutter run -d chrome --web-port=5050 --dart-define=ENV=dev lib/main.dart 
```

