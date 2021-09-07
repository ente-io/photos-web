interface RequestQueueItem {
    request: (canceller?: RequestCanceller) => Promise<any>;
    callback: (response) => void;
    isCanceled: { status: boolean };
    canceller: { exec: () => void };
}

interface RequestCanceller {
    exec: () => void;
}

export default class QueueProcessor<T> {
    private requestQueue: RequestQueueItem[] = [];

    private requestInProcessing = 0;

    private onInactiveCallTimer = null;

    constructor(
        private maxParallelProcesses: number,
        private onInactive: () => void = () => {},
        private waitBeforeInactive = 0
    ) {}

    public queueUpRequest(request: () => Promise<T>) {
        const isCanceled = { status: false };
        const canceller: RequestCanceller = {
            exec: () => {
                isCanceled.status = true;
            },
        };

        const promise = new Promise<T>((resolve) => {
            this.requestQueue.push({
                request,
                callback: resolve,
                isCanceled,
                canceller,
            });
            this.pollQueue();
        });

        return { promise, canceller };
    }

    async pollQueue() {
        if (this.requestInProcessing < this.maxParallelProcesses) {
            this.requestInProcessing++;
            await this.processQueue();
            this.requestInProcessing--;
        }
    }

    public async processQueue() {
        clearTimeout(this.onInactiveCallTimer);
        while (this.requestQueue.length > 0) {
            const queueItem = this.requestQueue.pop();
            let response = null;

            if (queueItem.isCanceled.status) {
                response = null;
            } else {
                try {
                    response = await queueItem.request(queueItem.canceller);
                } catch (e) {
                    response = null;
                }
            }
            queueItem.callback(response);
        }
        this.onInactiveCallTimer = setTimeout(
            () => this.onInactive(),
            this.waitBeforeInactive
        );
    }
}
