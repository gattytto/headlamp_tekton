// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/index.tsx

import { registerTektonSidebar } from './sidebar';
import { registerTektonRoutes } from './routes';
import { registerMapSource } from '@kinvolk/headlamp-plugin/lib';
import { tektonSource } from './map/tektonSource';
import { Icon, addIcon } from '@iconify/react';
import customSvgIcon from './favicon.svg?raw';


addIcon('custom:tekton', {
  body: customSvgIcon,
  width: 24,
  height: 24,
});

registerTektonSidebar();
registerTektonRoutes();
registerMapSource(tektonSource);