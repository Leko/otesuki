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
  onError?: (error: Error, task: T) => void;
  onRetire?: (task: T, errors: Array<Error>) => void;
};
type Option<T> = {
  retry: number;
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

  private pushTask(task: Task<T>): void {
    this.tasks.push(task);
    this.requestPopInIdle();
  }

  private execute = async (): Promise<void> => {
    const task = this.tasks.shift();
    if (!task) {
      return;
    }

    const { action, retry, errors } = task;
    try {
      await this.executor(action);
    } catch (error) {
      this.option.onError(error, action);
      if (retry + 1 <= this.option.retry) {
        this.pushTask({
          action,
          retry: retry + 1,
          errors: errors.concat([error])
        });
      } else {
        this.option.onRetire(action, errors.concat([error]));
      }
    }
  };

  private requestPopInIdle(): void {
    requestIdleCallback(this.execute);
  }
}
