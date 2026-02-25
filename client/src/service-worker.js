/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

clientsClaim();
self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);

const handler = createHandlerBoundToURL("/index.html");

registerRoute(
  ({ request, url }) =>
    request.mode === "navigate",
  handler
);