import {
    DiscourseEntry,
    DiscoursePool,
    Fact,
    GameBoard,
    IllocutionaryProposition,
    IllocutionaryRelation, PlanInfo,
    PrivateInformationState,
    TotalInformationState,
} from "./models";
import {z} from "zod";

export class DialogGameBoard {
    readonly facts: Fact[];
    readonly moves: IllocutionaryProposition[];
    readonly resolvedDiscourses: string[];
    private activeDiscourseManager: ActiveDiscourseManager;

    constructor(gameBoard?: GameBoard) {
        this.facts = gameBoard?.facts || [];
        this.moves = gameBoard?.moves || [];
        this.resolvedDiscourses = gameBoard?.resolvedDiscourses || [];
        this.activeDiscourseManager = new ActiveDiscourseManager(
            gameBoard?.discoursePool || {entries: {}},
            gameBoard?.activeDiscourse?.entryIds || [],

        );
    }

    toJson(): GameBoard {
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

    addFact(fact: Fact): void {
        this.facts.push(fact);
    }

    addResolvedDiscourses(reason: string): void {
        this.resolvedDiscourses.push(reason);
    }

    getFacts(): Fact[] {
        return this.facts;
    }

    getFactsAsString(): string {
        return this.facts.map((fact) => fact.proposition).join("\n");
    }

    getLatestMove(): IllocutionaryProposition | undefined {
        return this.moves[this.moves.length - 1];
    }

    getDiscourseAsStringCondensed(): string {
        const activeEntries: DiscourseEntry[] =
            this.activeDiscourseManager.getActiveDiscourseEntries()!;
        if (!activeEntries) {
            return "N/A";
        }
        return activeEntries
            .map(
                (entry) =>
                    `(${entry.tag}) ${entry.role}: ${entry.proposition}`,
            )
            .join("\n");
    }

    getDiscourseAsStringFull(): string {
        const activeEntries: DiscourseEntry[] =
            this.activeDiscourseManager.getActiveDiscourseEntries()!;
        if (!activeEntries) {
            return "N/A";
        }
        return activeEntries
            .map(
                (entry) =>
                    `Speaker: ${entry.speaker}, Role: ${entry.role}, Move: ${entry.tag}, ID: ${entry.id}, Utterance: ${entry.proposition}`,
            )
            .join("\n");
    }

    hasMoves(): boolean {
        return this.moves.length > 0;
    }

    playLatestMove(latestMove: IllocutionaryProposition): void {
        console.log(latestMove);
        const currentDiscourseEntryId =
            this.activeDiscourseManager.getLastEntryId() + 1;
        latestMove.discourseEntryId = currentDiscourseEntryId;
        this.moves.push(latestMove);

        const discourseEntry: DiscourseEntry = {
            id: currentDiscourseEntryId,
            tag: latestMove.illocutionaryRelation,
            proposition: latestMove.utterance!,
            linkedId:
                latestMove.illocutionaryRelation == IllocutionaryRelation.ASK
                    ? 0
                    : currentDiscourseEntryId - 1,
            speaker: latestMove.speaker,
            addressee: latestMove.addressee,
            role: latestMove.role
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
    readonly discoursePool: Map<number, DiscourseEntry>;

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
        discourseEntry: DiscourseEntry,
    ): void {
        if (this.discoursePool.has(discourseEntry.id)) {
            this.activeDiscourseEntryIds.push(discourseEntry.id);
        } else {
            throw new Error("Entry not found in the pool.");
        }
    }

    addEntryToPool(newDiscourseEntry: DiscourseEntry): void {
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

    getActiveEntries():  DiscourseEntry[] {
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

    getActiveDiscourseEntries(): DiscourseEntry[] | null {
        const lastActiveEntryId =
            this.activeDiscourseEntryIds[
            this.activeDiscourseEntryIds.length - 1
                ];
        if (!this.discoursePool.has(lastActiveEntryId)) {
            console.log(`getActiveDiscourseEntries null`);
            return null;
        }

        const linkedActiveEntries: DiscourseEntry[] = [];
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

    toJson(): TotalInformationState {
        return {
            privateInformationState: this.privateInformationState.toJson(),
            dialogGameBoard: this.dgb.toJson(),
        };
    }
}

export class DialogPIS {
    genre: string;

    goals: string;

    beliefs: string;

    planInfo?: PlanInfo;

    constructor(p: PrivateInformationState) {
        this.genre = p.genre;
        this.goals = p.goals || "";
        this.beliefs = p.beliefs || "";
        this.planInfo = p.planInfo
    }

    toJson(): PrivateInformationState {
        return {
            genre: this.genre,
            goals: this.goals,
            beliefs: this.beliefs,
            planInfo: this.planInfo
        };
    }
}
