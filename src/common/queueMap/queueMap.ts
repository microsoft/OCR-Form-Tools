import { Args, IQueue, Queue } from "./queue";

interface IQueueMap {
    [id: string]: IQueue;
}

export default class QueueMap {
    queueById: IQueueMap;
    constructor() {
        this.queueById = {};
    }

    /**
     * Get a copy of IQueueMap from QueueMap
     * @return QueueMap - IQueueMap
     */
    getMap = (): IQueueMap => {
        return { ...this.queueById };
    }

    /**
     * Get the IQueue by id. Create a new IQueue while get null.
     * @param id - id of the queue
     * @return IQueue
     */
    getQueueById = (id: string): IQueue => {
        if (!this.queueById.hasOwnProperty(id)) {
            this.queueById[id] = new Queue();
        }
        return this.queueById[id];
    }

    /**
     * Find a queue by id, then enqueue an object into the queue.
     * @param id - id of the queue
     * @param args - list of argument
     */
    enque = (id: string, args: Args) => {
        const { queue } = this.getQueueById(id);
        queue.push(args);
    }

    /**
     * @param id - id of the queue
     * @return - dequeued object
     */
    dequeue = (id: string): Args => {
        const { queue } = this.getQueueById(id);
        return queue.shift();
    }

    /**
     * Find a queue by id then dequeue. Then clear objects before the last one.
     * @param id - id of the queue
     * @return - dequeue object
     */
    dequeueUntilLast = (id: string): Args => {
        let ret = [];
        const { queue } = this.getQueueById(id);
        while (queue.length > 1) {
            ret = queue.shift();
        }
        return ret;
    }

    /** Find and return the last element in the queue
     * @param id - id of the queue
     * @return last element in the queue
     */
    getLast = (id: string): Args => {
        const { queue } = this.getQueueById(id);
        if (queue.length) {
            return queue[queue.length - 1];
        }
        return [];
    }

    /**
     * loop to use last element as parameters to call async method.
     * will prevent this function call while the queue is already looping by another function.
     * @param id - id of the queue
     * @param method - async method to call
     * @param paramsHandler - process dequeue object to method parameters
     * @param errorHandler - handle async method error
     */
    on = (id: string, method: (...args: any[]) => void, paramsHandler = (params) => params, errorHandler = console.error) => {
        const q = this.getQueueById(id);
        const loop = async () => {
            q.isLooping = true;
            while (q.queue.length) {
                this.dequeueUntilLast(id);
                const args = this.getLast(id);
                const params = args.map(paramsHandler);
                try {
                    await method(...params);
                } catch (err) {
                    errorHandler(err);
                }
                this.dequeue(id);
            }
            q.isLooping = false;
        }
        if (q.isLooping === false) {
            q.promise = loop();
        }
    }

    /**
     * call the callback function after loop finished
     * @param id - id of the queue
     * @param callback - callback after loop finished
     * @param args - callback arguments
     */
    callAfterLoop = async (id: string, callback: (...args: any[]) => void, args: Args = []) => {
        const q = this.getQueueById(id);
        if (q.promise) {
            await q.promise;
        }
        await callback(...args);
    }
}

export const queueMap = new QueueMap();
