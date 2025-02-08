import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import * as fs from 'node:fs';
import { Suspense, use } from 'react';

const filePath = 'count.txt';

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
  );
}

export const getCount = createServerFn({
  method: 'GET',
}).handler(async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return readCount();
});

export const updateCount = createServerFn({ method: 'POST' })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

export const Route = createFileRoute('/')({
  ssr: false,
  component: Home,
  loader: async () => {
    const countPromise = getCount();
    return { countPromise };
  },
});

function Home() {
  return (
    <Suspense fallback="Loading...">
      <SlowCounter />
    </Suspense>
  );
}

function SlowCounter() {
  const router = useRouter();
  const { countPromise } = Route.useLoaderData();
  const count = use(countPromise);

  return (
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
  );
}
