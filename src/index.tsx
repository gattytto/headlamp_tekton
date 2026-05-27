// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/index.tsx

import { registerTektonSidebar } from './sidebar';
import { registerTektonRoutes } from './routes';
import {
  registerDetailsViewHeaderAction,
  registerDetailsViewHeaderActionsProcessor,
  registerKindIcon,
  registerKubeObjectGlance,
  registerMapSource,
} from '@kinvolk/headlamp-plugin/lib';
import { tektonSource } from './map/tektonSource';
import { Icon, addIcon } from '@iconify/react';
import customSvgIcon from './favicon.svg?raw';
import { TektonGlance } from './components/TektonGlance';
import { TektonRunHeaderActions, isTektonRunResource } from './components/RunActions';

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

['EventListener', 'TriggerTemplate', 'TriggerBinding', 'ClusterTriggerBinding', 'ClusterInterceptor'].forEach(kind =>
  registerKindIcon(kind, tektonKindIcon, 'triggers.tekton.dev/v1alpha1')
);

registerKindIcon('EventListener', tektonKindIcon);

registerTektonSidebar();
registerTektonRoutes();
registerKubeObjectGlance({ id: 'tekton-glance', component: TektonGlance });
registerDetailsViewHeaderAction({
  id: 'tekton-run-actions',
  action: TektonRunHeaderActions,
});
registerDetailsViewHeaderActionsProcessor({
  id: 'tekton-run-actions-filter',
  processor: (resource: any, actions: any[]) => {
    if (isTektonRunResource(resource)) {
      return actions;
    }

    return actions.filter(action => action?.id !== 'tekton-run-actions');
  },
});
registerMapSource(tektonSource);
