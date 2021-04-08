import QueueMap from "./queueMap";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("QueueMap", () => {
    test("dequeueUntilLast", () => {
        const queueMap = new QueueMap();
        const queueId = "1";
        const a = ["a", 1];
        const b = ["b", 2];
        queueMap.enque(queueId, a);
        queueMap.enque(queueId, b);
        queueMap.dequeueUntilLast(queueId);
        const { queue } = queueMap.getQueueById(queueId);
        expect([b]).toEqual(queue);
    })
    test("call enque while looping items in the queue", async () => {
        const queueMap = new QueueMap();
        const mockWrite = jest.fn();
        const queueId = "1";
        const sleepThenReturn = ms => async (...params) => {
            await mockWrite(...params);
            await sleep(ms);
        }
        const a = ["a", 1];
        const b = ["b", 2];
        const c = ["c", 3];
        const d = ["d", 4];
        const expected = [b, d]
        queueMap.enque(queueId, a);
        queueMap.enque(queueId, b);
        queueMap.on(queueId, sleepThenReturn(1000), params => params);
        queueMap.enque(queueId, c);
        queueMap.enque(queueId, d);
        await sleep(2000);
        expect(mockWrite.mock.calls.length).toBe(2);
        expect([mockWrite.mock.calls[0], mockWrite.mock.calls[1]]).toEqual(expected);
    })
    test("prevent call on twice.", async () => {
        const queueMap = new QueueMap();
        const queueId = "1";
        const mockWrite = jest.fn();
        const sleepThenReturn = ms => async (...params) => {
            await mockWrite(...params);
            await sleep(ms);
        }
        const a = ["a", 1];
        const b = ["b", 2];
        const c = ["c", 3];
        const d = ["d", 4];
        const expected = [b, d]
        queueMap.enque(queueId, a);
        queueMap.enque(queueId, b);
        queueMap.on(queueId, sleepThenReturn(1000), params => params);
        queueMap.enque(queueId, c);
        queueMap.on(queueId, sleepThenReturn(1000), params => params);
        queueMap.enque(queueId, d);
        await sleep(2000);
        expect(mockWrite.mock.calls.length).toBe(2);
        expect([mockWrite.mock.calls[0], mockWrite.mock.calls[1]]).toEqual(expected);
    })
    test("read last element.", async () => {
        const queueMap = new QueueMap();
        const queueId = "1";
        const f = jest.fn();
        const sleepThenReturn = ms => async (...params) => {
            await f(...params);
            await sleep(ms);
        }
        const a = ["a", 1];
        const b = ["b", 2];
        const c = ["c", 3];
        const d = ["d", 4];
        queueMap.enque(queueId, a);
        queueMap.enque(queueId, b);
        queueMap.on(queueId, sleepThenReturn(1000), params => params);
        queueMap.enque(queueId, c);
        queueMap.enque(queueId, d);
        expect(queueMap.getLast(queueId)).toEqual(d);
    })
    test("delete after write finished", async () => {
        const mockCallback = jest.fn();
        const mockWrite = jest.fn();
        const queueMap = new QueueMap();
        const queueId = "1";
        const mockAsync = ms => async (...params) => {
            await mockWrite(...params);
            await sleep(ms);
        }
        const a = ["a", 1];
        const b = ["b", 2];
        const c = ["c", 3];
        const d = ["d", 4];
        queueMap.enque(queueId, a);
        queueMap.enque(queueId, b);
        queueMap.on(queueId, mockAsync(1000));
        queueMap.enque(queueId, c);
        queueMap.enque(queueId, d);
        const args = [a, b];
        queueMap.callAfterLoop(queueId, mockCallback, args);
        await sleep(3000);
        expect(mockCallback.mock.calls.length).toBe(1);
        expect(mockCallback.mock.calls[0]).toEqual(args);
    })
    test("can call callback finished", async () => {
        const mockCallback = jest.fn();
        const queueMap = new QueueMap();
        const queueId = "1";
        queueMap.callAfterLoop(queueId, mockCallback);
        expect(mockCallback.mock.calls.length).toBe(1);
    })
})
