export default class ErrorWithContext extends Error {
    ancestors: ErrorWithContext[];
    parent: ErrorWithContext;
    rootCause: ErrorWithContext;

    constructor(
        originalError: ErrorWithContext | null = null,
        context: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        shift: number
    ) {
        if (!context) {
            throw new Error(
                'Attempted to create an ErrorWithContext without a context'
            );
        }
        super(context);
        console.log(this);
        this.parent = originalError;
        this.ancestors = [];
        let ancestors = this.parent;
        while (ancestors) {
            this.ancestors.push(ancestors);
            ancestors = (ancestors as ErrorWithContext).parent;
        }
        this.rootCause =
            (originalError as ErrorWithContext).rootCause ||
            originalError ||
            this;
        this.stack = this.stack + '\n' + originalError.stack;
    }
}
