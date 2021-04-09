export type Args = any[];

export interface IQueue {
    queue: Args[];
    isLooping: boolean;
    promise?: Promise<void>;
}

export class Queue implements IQueue {
    queue: Args[];
    isLooping: boolean;
    constructor() {
        this.queue = [];
        this.isLooping = false;
    }
}
