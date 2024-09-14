import NodeCache from 'node-cache';
import {Player} from "@interlocution/core";

interface PlayerCache {
    get(playerId: string): Promise<Player | null>;
    set(playerId: string, player: Player): Promise<void>;
    delete(playerId: string): Promise<void>;
}

export class InMemoryPlayerCache implements PlayerCache {
    private cache: NodeCache;

    constructor(ttlSeconds: number = 3600) {
        this.cache = new NodeCache({ stdTTL: ttlSeconds });
    }

    async get(playerId: string): Promise<Player | null> {
        return this.cache.get<Player>(playerId) || null;
    }

    async set(playerId: string, player: Player): Promise<void> {
        this.cache.set(playerId, player);
    }

    async delete(playerId: string): Promise<void> {
        this.cache.del(playerId);
    }
}