# otesuki(お手隙)

[![npm](https://img.shields.io/npm/v/otesuki.svg)](https://www.npmjs.com/package/otesuki)
[![license](https://img.shields.io/github/license/Leko/otesuki.svg)](https://opensource.org/licenses/MIT)
[![CircleCI](https://circleci.com/gh/Leko/otesuki.svg?style=svg)](https://circleci.com/gh/Leko/otesuki)
[![codecov](https://codecov.io/gh/Leko/otesuki/branch/master/graph/badge.svg)](https://codecov.io/gh/Leko/otesuki)

Minimal task queue executed when CPU is idle

## Install

```
npm install otesuki
```

## Usage

```ts
import { Queue } from "otesuki";

const executor = action => {
  switch (action.type) {
    case "preload":
      return fetch(action.payload.url);
    case "createSomeHeavyCache":
    // Some heavy task
  }
};

const queue = new Queue(executor, {
  debug: true
});

queue.push({ type: "preload", payload: { url: "https://example.com" } });
queue.push({ type: "createSomeHeavyCache" });
```

## API

### new Queue

```ts
const queue = new Queue(executor, option);
```

| Argument     | Required | Description                                    | Default |
| ------------ | -------- | ---------------------------------------------- | ------- |
| executor     | Yes      | task executor function. Is must return Promise |         |
| option       | -        | Option object (see below)                      | `{}`    |
| option.debug | -        | Log verbosely                                  | `false` |
| option.retry | -        | Count of retry                                 | `3`     |

### Queue.push

```ts
queue.push({});
```

Queue.push can receive any objects.  
It will passed to argument of `executor`.

### For TypeScript

otesuki supports TypeScript.

```ts
type PreloadAction = {
  type: 'preload',
  payload: {
    url: string
  }
}
type SomeHeavyTaskAction = {
  type: 'someHeavyTask'
}
type Action = PreloadAction | SomeHeavyTaskAction

const executor = async (action: Action): Promise<void> => {
  switch (action.type) {
    case 'preload':
      return fetch(...)
    case 'someHeavyTask':
      await ...
  }
}

const queue: Queue<Action> = new Queue(executor)
queue.push()
```

## Development

```
git clone git@github.com:xxx/otesuki.git # Your forked package
cd otesuki
npm i
npx lerna bootstrap
```

## License

This package under [MIT](https://opensource.org/licenses/MIT) license.
