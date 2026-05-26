// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/routes.tsx

import { registerRoute } from '@kinvolk/headlamp-plugin/lib';

import { OverviewPage } from './pages/Overview';
import { PipelinesPage } from './pages/Pipelines';
import { PipelineRunsPage } from './pages/PipelineRuns';
import { TasksPage } from './pages/Tasks';
import { TaskRunsPage } from './pages/TaskRuns';
import { TriggersPage } from './pages/Triggers';
import { EventListenersPage } from './pages/EventListeners';

import { PipelineDetailsPage } from './pages/PipelineDetails';
import { PipelineRunDetailsPage } from './pages/PipelineRunDetails';
import { TaskDetailsPage } from './pages/TaskDetails';
import { TaskRunDetailsPage } from './pages/TaskRunDetails';
import { TriggerTemplateDetailsPage } from './pages/TriggerTemplateDetails';
import { EventListenerDetailsPage } from './pages/EventListenerDetails';
import { TriggerBindingDetailsPage } from './pages/TriggerBindingDetails';
import { ClusterInterceptorDetailsPage } from './pages/ClusterInterceptorDetails';
import { ClusterInterceptorsPage } from './pages/ClusterInterceptors';

export function registerTektonRoutes() {
  registerRoute({
    path: '/tekton/overview',
    sidebar: 'Tekton',
    name: 'Overview',
    component: OverviewPage,
  });

  registerRoute({
    path: '/tekton/pipelines',
    sidebar: 'Tekton',
    name: 'Pipelines',
    exact: true,
    component: PipelinesPage,
  });

  registerRoute({
    path: '/tekton/pipelines/:namespace/:name', 
    component: PipelineDetailsPage,
    name: 'pipeline-details',
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/pipelineruns',
    sidebar: 'Tekton',
    name: 'PipelineRuns',
    exact: true,
    component: PipelineRunsPage,
  });

  registerRoute({
    path: '/tekton/pipelineruns/:namespace/:name', 
    component: PipelineRunDetailsPage,
    name: 'pipelinerun-details',
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/tasks',
    sidebar: 'Tekton',
    name: 'Tasks',
    exact: true,
    component: TasksPage,
  });

  registerRoute({
    path: '/tekton/tasks/:namespace/:name', 
    component: TaskDetailsPage,
    name: 'task-details',
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/taskruns',
    sidebar: 'Tekton',
    name: 'TaskRuns',
    exact: true,
    component: TaskRunsPage,
  });

  registerRoute({
    path: '/tekton/taskruns/:namespace/:name', 
    component: TaskRunDetailsPage,
    name: 'taskrun-details',
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/triggers',
    sidebar: 'Tekton',
    name: 'Triggers',
    exact: true,
    component: TriggersPage,
  });

  registerRoute({
    path: '/tekton/eventlisteners',
    sidebar: 'Tekton',
    name: 'EventListeners',
    exact: true,
    component: EventListenersPage,
  });

  registerRoute({
    path: '/tekton/triggerbindings/:namespace/:name', 
    component: TriggerBindingDetailsPage,
    name: 'trigger-binding-details',
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/triggertemplates/:namespace/:name', 
    component: TriggerTemplateDetailsPage,
    name: 'trigger-template-details', 
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/eventlisteners/:namespace/:name', 
    component: EventListenerDetailsPage,
    name: 'event-listener-details', 
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/clusterinterceptors/:name',
    component: ClusterInterceptorDetailsPage,
    name: 'clusterinterceptor-details',
    sidebar: null,
  });

  registerRoute({
    path: '/tekton/clusterinterceptors',
    sidebar: 'Tekton',
    name: 'ClusterInterceptors',
    exact: true,
    component: ClusterInterceptorsPage,
  });
}
