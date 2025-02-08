import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Suspense, use } from 'react';
import { createServerFn } from '@tanstack/start';
import * as fs from 'node:fs';

const filePath = 'count.txt';

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
  );
}

export const getCount = createServerFn({
  method: 'GET',
}).handler(async () => {
  return readCount();
});

export const slowGetCount = createServerFn({
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
    const count = await getCount();
    const slowCount = slowGetCount(); // promise

    return {
      count,
      slowCount,
    };
  },
});

function Home() {
  const router = useRouter();
  const { count, slowCount } = Route.useLoaderData();

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

      <Suspense fallback={<div>Loading...</div>}>
        <SlowCounter countPromise={slowCount} />
      </Suspense>
    </>
  );
}

function SlowCounter({ countPromise }: { countPromise: Promise<number> }) {
  const loadedCount = use(countPromise);
  return <div>{loadedCount}</div>;
}
