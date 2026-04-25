const OFFLINE_PAGE_CACHE = 'pages';
const OFFLINE_ROUTES = [
  '/',
  '/study',
  '/hsk-listening',
  '/sentence-study',
  '/memorize',
  '/library',
  '/library/quiz',
  '/settings',
  '/grammar',
  '/quiz',
  '/quiz/easy',
  '/quiz/easy?mode=chapter',
  '/quiz/easy?mode=topic',
  '/quiz/medium',
  '/quiz/medium?mode=chapter',
  '/quiz/medium?mode=topic',
  '/quiz/hard',
  '/quiz/hard?mode=chapter',
  '/quiz/hard?mode=topic',
  '/toeic-part2',
  '/toeic-part5',
  '/sentence-completion/1',
  '/sentence-completion/2',
  '/sentence-completion/3',
  '/sentence-completion/4',
  '/sentence-completion/5',
  '/sentence-completion/6',
];

async function warmOfflineRoutes() {
  const cache = await caches.open(OFFLINE_PAGE_CACHE);

  await Promise.allSettled(
    OFFLINE_ROUTES.map(async (url) => {
      const request = new Request(url, {
        credentials: 'same-origin',
        headers: { Accept: 'text/html' },
      });
      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(warmOfflineRoutes());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'WARM_OFFLINE_ROUTES') {
    event.waitUntil(warmOfflineRoutes());
  }
});
