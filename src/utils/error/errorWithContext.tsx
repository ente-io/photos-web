export default class ErrorWithContext extends Error {
    ancestors: ErrorWithContext[];
    parent: ErrorWithContext;
    rootCause: ErrorWithContext;

    constructor(
        originalError: ErrorWithContext | null = null,
        context: string,
        shift: number
    ) {
        if (!context) {
            throw new Error(
                'Attempted to create an ErrorWithContext without a context'
            );
        }
        super(context);
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
        this.stack =
            this.stack
                .split('\n')
                .slice(4 + shift, 5 + shift)
                .join('\n') +
            '\n' +
            originalError.stack;
    }
}
