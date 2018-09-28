import { Queue } from "../src/Queue";

beforeAll(() => {
  // @ts-ignore
  global.requestIdleCallback = fn => setTimeout(fn, 0);
});

test("Can override default option: retry", () => {
  const expected = 999;
  const queue = new Queue(async () => {}, { retry: expected });
  expect(queue.option.retry).toBe(expected);
});
test("Can override default option: onError", () => {
  const expected = () => {};
  const queue = new Queue(async () => {}, { onError: expected });
  expect(queue.option.onError).toBe(expected);
});
test("Can override default option: onRetire", () => {
  const expected = () => {};
  const queue = new Queue(async () => {}, { onRetire: expected });
  expect(queue.option.onRetire).toBe(expected);
});

test("executor should receive pushed action", () => {
  const spy = jest.fn(async () => {});
  const queue = new Queue(spy);
  const action = { type: "hoge", payload: { id: "xxx" } };
  queue.push(action);
  return new Promise(resolve => {
    setTimeout(() => {
      expect(spy).toBeCalledWith(action);
      resolve();
    }, 0);
  });
});
test("executor should called specified number of times", () => {
  const spy = jest.fn(() => Promise.reject(new Error("always rejects")));
  const times = 10;
  return new Promise(resolve => {
    const queue = new Queue(spy, {
      retry: times,
      onRetire: () => {
        expect(spy).toHaveBeenCalledTimes(times + 1); // 1 means first call (not a retry)
        resolve();
      }
    });
    const action = { type: "hoge", payload: { id: "xxx" } };
    queue.push(action);
  });
});
test("onRetire should called when exceeded max retry count", () => {
  const error = new Error("always rejects");
  const spy = jest.fn(() => Promise.reject(error));
  const action = { type: "hoge", payload: { id: "xxx" } };

  return new Promise(resolve => {
    const queue = new Queue(spy, {
      onRetire: (task, errors) => {
        expect(task).toBe(action);
        errors.forEach(e => {
          expect(e).toBe(error);
        });
        resolve();
      }
    });
    queue.push(action);
  });
});
test("onError should called when rejects executor", () => {
  const error = new Error("always rejects");
  const spy = jest.fn(() => Promise.reject(error));
  const action = { type: "hoge", payload: { id: "xxx" } };
  return new Promise(resolve => {
    const queue = new Queue(spy, {
      onError: e => {
        expect(e).toBe(error);
        resolve();
      }
    });
    queue.push(action);
  });
});

test("push can execute multiple tasks", () => {
  const spy = jest.fn(() => {});
  const action1 = { type: "foo", payload: { id: "xxx" } };
  const action2 = { type: "bar", payload: { id: "yyy" } };
  return new Promise(resolve => {
    const queue = new Queue(spy);
    queue.push(action1);
    queue.push(action2);
    // @ts-ignore
    requestIdleCallback(() => {
      expect(spy).nthCalledWith(1, action1);
      expect(spy).nthCalledWith(2, action2);
      resolve();
    });
  });
});

test("Queue should output debug logs when option.debug=true", () => {
  const spyLog = jest.spyOn(console, "log");
  spyLog.mockImplementation(() => {});

  const spy = jest.fn(() => Promise.reject(new Error("always rejects")));
  return new Promise(resolve => {
    const queue = new Queue(spy, {
      debug: true,
      onRetire: () => {
        expect(console.log).toBeCalled();
        resolve();
      }
    });
    const action = { type: "hoge", payload: { id: "xxx" } };
    queue.push(action);
  });
});
