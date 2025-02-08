// app/routes/index.tsx
import * as fs from 'node:fs';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import { Suspense, use } from 'react';

const filePath = 'count.txt';

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
  );
}

const updateCount = createServerFn({ method: 'POST' })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

const getCount = createServerFn({
  method: 'GET',
}).handler(() => {
  return readCount();
});

const getSlowCount = createServerFn({
  method: 'GET',
}).handler(async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return readCount();
});

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const count = await getCount();
    const slowCount = getSlowCount(); // promise that resolves after 3 seconds

    return {
      count,
      slowCount,
    };
  },
});

function Home() {
  const router = useRouter();
  const { count } = Route.useLoaderData();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          updateCount({ data: 1 }).then(() => {
            router.invalidate();
          });
        }}
      >
        Add 1 to {count}?
      </button>

      <Suspense fallback="Loading...">
        <SlowCount />
      </Suspense>
    </>
  );
}

function SlowCount() {
  const { slowCount } = Route.useLoaderData();
  const count = use(slowCount);
  return <div>{count}</div>;
}
