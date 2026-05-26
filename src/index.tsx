// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/index.tsx

import { registerTektonSidebar } from './sidebar';
import { registerTektonRoutes } from './routes';
import { registerKindIcon, registerMapSource } from '@kinvolk/headlamp-plugin/lib';
import { tektonSource } from './map/tektonSource';
import { Icon, addIcon } from '@iconify/react';
import customSvgIcon from './favicon.svg?raw';

addIcon('custom:tekton', {
  body: customSvgIcon,
});

const tektonKindIcon = {
  icon: <Icon icon="custom:tekton" width="100%" height="100%" />,
  color: '#d73566',
};

['Pipeline', 'PipelineRun', 'Task', 'TaskRun'].forEach(kind =>
  registerKindIcon(kind, tektonKindIcon, 'tekton.dev')
);

['Pipeline', 'PipelineRun', 'Task', 'TaskRun'].forEach(kind =>
  registerKindIcon(kind, tektonKindIcon, 'tekton.dev/v1')
);

['EventListener', 'TriggerTemplate', 'TriggerBinding', 'ClusterTriggerBinding', 'ClusterInterceptor'].forEach(kind =>
  registerKindIcon(kind, tektonKindIcon, 'triggers.tekton.dev')
);

['EventListener', 'TriggerTemplate', 'TriggerBinding', 'ClusterTriggerBinding', 'ClusterInterceptor'].forEach(kind =>
  registerKindIcon(kind, tektonKindIcon, 'triggers.tekton.dev/v1beta1')
);

registerTektonSidebar();
registerTektonRoutes();
registerMapSource(tektonSource);
