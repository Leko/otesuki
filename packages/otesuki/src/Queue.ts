// https://github.com/Microsoft/TypeScript/issues/21309
type RequestIdleCallbackOptions = {
  timeout: number;
};
type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: (() => number);
};
type RequestIdleCallback = ((
  callback: ((deadline: RequestIdleCallbackDeadline) => void),
  opts?: RequestIdleCallbackOptions
) => any);

declare var requestIdleCallback: RequestIdleCallback;

type Executor<T> = (action: T) => Promise<void>;
type UserOption<T> = {
  retry?: number;
  debug?: boolean;
  onError?: (error: Error, task: T) => void;
  onRetire?: (task: T, errors: Array<Error>) => void;
};
type Option<T> = {
  retry: number;
  debug: boolean;
  onError: (error: Error, task: T) => void;
  onRetire: (task: T, errors: Array<Error>) => void;
};

type Task<T> = {
  action: T;
  retry: number;
  errors: Array<Error>;
};

const defaultOprion = {
  retry: 3,
  debug: false,
  onError: () => {},
  onRetire: () => {}
};

export class Queue<T> {
  tasks: Array<Task<T>>;
  executor: Executor<T>;
  option: Option<T>;

  constructor(executor: Executor<T>, option: UserOption<T> = {}) {
    this.executor = executor;
    this.option = { ...defaultOprion, ...option };
    this.tasks = [];
  }

  push(action: T): void {
    this.pushTask({ action, retry: 0, errors: [] });
  }

  private log(message: string, getMeta: () => any = () => {}): void {
    if (!this.option.debug) return;
    console.log(`[otesuki] ${message}`, getMeta() || "");
  }

  private pushTask(task: Task<T>): void {
    this.tasks.push(task);
    this.log("Task pushed. Waiting for CPU is idle", () => {
      const { action, retry } = task;
      return { action, retry };
    });
    this.requestPopInIdle();
  }

  private execute = async (): Promise<void> => {
    const task = this.tasks.shift();
    this.log("Run execute");
    if (!task) {
      this.log("Queue is empty. Waiting for a new task");
      return;
    }

    const { action, retry, errors } = task;
    try {
      this.log("Task found. Run executor", () => action);
      await this.executor(action);
      this.log("Run executor successful");
    } catch (error) {
      this.log("Run executor failed", () => error);
      this.option.onError(error, action);
      if (retry + 1 <= this.option.retry) {
        this.log(
          `There's still retry left (${this.option.retry -
            retry} times). Enqueue a retry task`,
          () => action
        );
        this.pushTask({
          action,
          retry: retry + 1,
          errors: errors.concat([error])
        });
      } else {
        const lastErrors = errors.concat([error]);
        this.log(
          "No retry left. Call onRetire with these errors",
          () => lastErrors
        );
        this.option.onRetire(action, lastErrors);
      }
    }
  };

  private requestPopInIdle(): void {
    requestIdleCallback(this.execute);
  }
}
