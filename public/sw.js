const CACHE_NAME = "skillsync-v1";
const STATIC_CACHE = "skillsync-static-v1";
const DYNAMIC_CACHE = "skillsync-dynamic-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  // Add other critical assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/v1\/users\/profile/,
  /\/api\/v1\/skills/,
  /\/api\/v1\/notifications/,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker: Static assets cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache static assets", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // Handle different types of requests
  if (request.destination === "document") {
    // HTML documents - network first, fallback to cache
    event.respondWith(handleDocumentRequest(request));
  } else if (isApiRequest(request)) {
    // API requests - cache first for specific endpoints, network first for others
    event.respondWith(handleApiRequest(request));
  } else {
    // Static assets - cache first
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle document requests (HTML pages)
async function handleDocumentRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    return caches.match("/offline.html");
  }
}

// Handle API requests
async function handleApiRequest(request) {
  const shouldCacheFirst = API_CACHE_PATTERNS.some((pattern) =>
    pattern.test(request.url)
  );

  if (shouldCacheFirst) {
    // Cache first strategy for specific endpoints
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Update cache in background
        updateCacheInBackground(request);
        return cachedResponse;
      }
    } catch (error) {
      console.error("Cache lookup failed:", error);
    }
  }

  // Network first strategy
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response
    return new Response(
      JSON.stringify({
        error: "Network unavailable",
        offline: true,
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Both cache and network failed
    console.error("Failed to fetch static asset:", request.url, error);

    // Return a fallback response for images
    if (request.destination === "image") {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Image unavailable</text></svg>',
        { headers: { "Content-Type": "image/svg+xml" } }
      );
    }

    throw error;
  }
}

// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    console.error("Background cache update failed:", error);
  }
}

// Check if request is for API
function isApiRequest(request) {
  return request.url.includes("/api/");
}

// Handle background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();

    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options);
        // Remove successful action
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error("Failed to sync action:", action, error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Placeholder functions for offline action management
async function getOfflineActions() {
  // Implement IndexedDB or localStorage logic
  return [];
}

async function removeOfflineAction(id) {
  // Implement removal logic
}

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle message from main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
