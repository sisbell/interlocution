import {
    DiscourseEntry,
    DiscourseEntryType,
    DiscoursePool,
    FactType,
    GameboardType,
    IllocutionaryPropositionType,
    IllocutionaryRelation,
    PrivateInformationStateType,
    TotalInformationStateType,
} from "./models";
import {z} from "zod";

export class DialogGameBoard {
    readonly facts: FactType[];
    readonly moves: IllocutionaryPropositionType[];
    readonly resolvedDiscourses: string[];
    private activeDiscourseManager: ActiveDiscourseManager;

    constructor(gameboard?: GameboardType) {
        this.facts = gameboard?.facts || [];
        this.moves = gameboard?.moves || [];
        this.resolvedDiscourses = gameboard?.resolvedDiscourses || [];
        this.activeDiscourseManager = new ActiveDiscourseManager(
            gameboard?.discoursePool || {entries: {}},
            gameboard?.activeDiscourse?.entryIds || [],

        );
    }

    toJson(): GameboardType {
        return {
            name: "Default",
            moves: this.moves,
            facts: this.facts,
            resolvedDiscourses: this.resolvedDiscourses,
            activeDiscourse: {
                entryIds:
                    this.activeDiscourseManager.getActiveDiscourseEntryIds()
            },
            discoursePool:
                this.activeDiscourseManager.getDiscoursePoolAsArray(),
        };
    }

    isFirstTurn(): boolean {
        const latestMove = this.getLatestMove();
        return latestMove === undefined || latestMove.utterance === null;
    }

    addFact(fact: FactType): void {
        this.facts.push(fact);
    }

    addResolvedDiscourses(reason: string): void {
        this.resolvedDiscourses.push(reason);
    }

    getFacts(): FactType[] {
        return this.facts;
    }

    getFactsAsString(): string {
        return this.facts.map((fact) => fact.proposition).join("\n");
    }

    getLatestMove(): IllocutionaryPropositionType | undefined {
        return this.moves[this.moves.length - 1];
    }

    getDiscourseAsString(): string {
        const activeEntries: DiscourseEntryType[] =
            this.activeDiscourseManager.getActiveDiscourseEntries()!;
        if (!activeEntries) {
            return "N/A";
        }
        return activeEntries
            .map(
                (entry) =>
                    `Speaker: ${entry.speaker}, Move: ${entry.tag}, ID: ${entry.id}, Utterance: ${entry.proposition}`,
            )
            .join("\n");
    }

    hasMoves(): boolean {
        return this.moves.length > 0;
    }

    playLatestMove(latestMove: IllocutionaryPropositionType): void {
        console.log(latestMove);
        const currentDiscourseEntryId =
            this.activeDiscourseManager.getLastEntryId() + 1;
        latestMove.discourseEntryId = currentDiscourseEntryId;
        this.moves.push(latestMove);

        const discourseEntry: DiscourseEntryType = {
            id: currentDiscourseEntryId,
            tag: latestMove.illocutionaryRelation,
            proposition: latestMove.utterance!,
            linkedId:
                latestMove.illocutionaryRelation == IllocutionaryRelation.ASK
                    ? 0
                    : currentDiscourseEntryId - 1,
            speaker: latestMove.speaker,
            addressee: latestMove.addressee,
        };
        this.activeDiscourseManager.addEntryToPool(discourseEntry);
        this.activeDiscourseManager.addActiveDiscourseEntry(discourseEntry);
    }

    updateActiveEntries(downdatedIds: number[]) {
        this.activeDiscourseManager.updateActiveEntries(downdatedIds);
    }
}

export class ActiveDiscourseManager {
    private activeDiscourseEntryIds: number[];
    readonly discoursePool: Map<number, z.infer<typeof DiscourseEntry>>;

    constructor(
        initialPool: z.infer<typeof DiscoursePool> = {entries: {}},
        activeDiscourseEntryIds: number[] = [],
    ) {
        this.activeDiscourseEntryIds = [...activeDiscourseEntryIds];
        this.discoursePool = new Map(
            Object.entries(initialPool.entries).map(
                ([idString, proposition]) => [
                    parseInt(idString, 10),
                    proposition,
                ],
            ),
        );
    }

    getActiveDiscourseEntryIds(): number[] {
        return this.activeDiscourseEntryIds;
    }

    addActiveDiscourseEntry(
        discourseEntry: z.infer<typeof DiscourseEntry>,
    ): void {
        if (this.discoursePool.has(discourseEntry.id)) {
            this.activeDiscourseEntryIds.push(discourseEntry.id);
        } else {
            throw new Error("Entry not found in the pool.");
        }
    }

    addEntryToPool(newDiscourseEntry: z.infer<typeof DiscourseEntry>): void {
        if (this.discoursePool.has(newDiscourseEntry.id)) {
            throw new Error("Entry ID already exists in the pool.");
        }
        this.discoursePool.set(newDiscourseEntry.id, newDiscourseEntry);
    }

    updateActiveEntries(downdatedIds: number[]) {
        const toRemove = new Set(downdatedIds.map((id) => Number(id)));
        this.activeDiscourseEntryIds = this.activeDiscourseEntryIds.filter(
            (num) => !toRemove.has(Number(num)),
        );
    }

    getActiveEntries(): z.infer<typeof DiscourseEntry>[] {
        return Array.from(this.activeDiscourseEntryIds).map(
            (id) => this.discoursePool.get(id)!,
        );
    }

    getLastEntryId(): number {
        const entryIds = Array.from(this.discoursePool.keys());
        return entryIds.length > 0 ? Math.max(...entryIds) : 0;
    }

    getActiveEntryCount(): number {
        return this.activeDiscourseEntryIds.length;
    }

    getDiscoursePool() {
        return this.discoursePool;
    }

    getDiscoursePoolAsArray(): z.infer<typeof DiscoursePool> {
        const entries = Object.fromEntries(
            Array.from(this.discoursePool.entries()).map(([key, value]) => [
                key,
                value,
            ]),
        );
        return {entries};
    }

    getActiveDiscourseEntries(): z.infer<typeof DiscourseEntry>[] | null {
        const lastActiveEntryId =
            this.activeDiscourseEntryIds[
            this.activeDiscourseEntryIds.length - 1
                ];
        if (!this.discoursePool.has(lastActiveEntryId)) {
            console.log(`getActiveDiscourseEntries null`);
            return null;
        }

        const linkedActiveEntries: z.infer<typeof DiscourseEntry>[] = [];
        let currentQuestionId: number | undefined = lastActiveEntryId;

        while (currentQuestionId !== undefined) {
            const currentQuestion = this.discoursePool.get(currentQuestionId);
            if (!currentQuestion) {
                console.log(`getActiveDiscourseEntries AAA`);
                console.log(
                    `linkedActiveEntries: ${JSON.stringify(linkedActiveEntries.reverse())}`,
                );
                return linkedActiveEntries;
            }
            console.log(
                `getActiveDiscourseEntries push question: ${JSON.stringify(currentQuestion)}`,
            );
            linkedActiveEntries.push(currentQuestion);
            currentQuestionId = currentQuestion.linkedId;
        }
        console.log(
            `linkedActiveEntries: ${JSON.stringify(linkedActiveEntries.reverse())}`,
        );
        return linkedActiveEntries;
    }
}

export class DialogTIS {
    readonly dgb: DialogGameBoard;

    readonly privateInformationState: DialogPIS;

    constructor(dgb: DialogGameBoard, privateInformationState: DialogPIS) {
        this.dgb = dgb;
        this.privateInformationState = privateInformationState;
    }

    toJson(): TotalInformationStateType {
        return {
            privateInformationState: this.privateInformationState.toJson(),
            dialogGameboard: this.dgb.toJson(),
        };
    }
}

export class DialogPIS {
    genre: string;

    goals: string;

    beliefs: string;

    constructor(p: PrivateInformationStateType) {
        this.genre = p.genre;
        this.goals = p.goals || "";
        this.beliefs = p.beliefs || "";
    }

    toJson(): PrivateInformationStateType {
        return {
            genre: this.genre,
            goals: this.goals,
            beliefs: this.beliefs,
            agenda: [],
        };
    }
}
