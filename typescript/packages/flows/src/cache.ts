import NodeCache from 'node-cache';
import {PlayerType} from "@interlocution/core";

interface PlayerCache {
    get(playerId: string): Promise<PlayerType | null>;
    set(playerId: string, player: PlayerType): Promise<void>;
    delete(playerId: string): Promise<void>;
}

export class InMemoryPlayerCache implements PlayerCache {
    private cache: NodeCache;

    constructor(ttlSeconds: number = 3600) {
        this.cache = new NodeCache({ stdTTL: ttlSeconds });
    }

    async get(playerId: string): Promise<PlayerType | null> {
        return this.cache.get<PlayerType>(playerId) || null;
    }

    async set(playerId: string, player: PlayerType): Promise<void> {
        this.cache.set(playerId, player);
    }

    async delete(playerId: string): Promise<void> {
        this.cache.del(playerId);
    }
}