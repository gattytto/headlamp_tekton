// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/sidebar.ts
import { registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';

export function registerTektonSidebar() {
  registerSidebarEntry({
    name: 'Tekton',
    url: '/tekton/overview',
    icon: 'custom:tekton',
    parent: '',
    label: 'Tekton',
  });

  registerSidebarEntry({
    name: 'Pipelines',
    url: '/tekton/pipelines',
    parent: 'Tekton',
    label: 'Pipelines',
  });

  registerSidebarEntry({
    name: 'PipelineRuns',
    url: '/tekton/pipelineruns',
    parent: 'Tekton',
    label: 'PipelineRuns',
  });

  registerSidebarEntry({
    name: 'Tasks',
    url: '/tekton/tasks',
    parent: 'Tekton',
    label: 'Tasks',
  });

  registerSidebarEntry({
    name: 'TaskRuns',
    url: '/tekton/taskruns',
    parent: 'Tekton',
    label: 'TaskRuns',
  });

  registerSidebarEntry({
    name: 'Triggers',
    url: '/tekton/triggers',
    parent: 'Tekton',
    label: 'Triggers',
  });

  registerSidebarEntry({
    name: 'EventListeners',
    url: '/tekton/eventlisteners',
    parent: 'Tekton',
    label: 'EventListeners',
  });

  registerSidebarEntry({
    name: 'ClusterInterceptors',
    url: '/tekton/clusterinterceptors',
    parent: 'Tekton',
    label: 'ClusterInterceptors',
  });
}
