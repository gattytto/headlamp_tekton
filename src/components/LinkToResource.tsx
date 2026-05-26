// SPDX-License-Identifier: EPL-2.0

import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';

type Props = {
  name: string;
  kind?: string;
  namespace?: string;
  kubeObject?: any;
};

export function LinkToResource({ name, kind, namespace, kubeObject }: Props) {
  let routeName: string | null = null;
  let requiresNamespace = true;

  switch (kind) {
    case 'Pipeline':
      routeName = 'pipeline-details';
      break;
    case 'PipelineRun':
      routeName = 'pipelinerun-details';
      break;
    case 'Task':
      routeName = 'task-details';
      break;
    case 'TaskRun':
      routeName = 'taskrun-details';
      break;
    case 'TriggerBinding':
      routeName = 'trigger-binding-details';
      break;
    case 'TriggerTemplate':
      routeName = 'trigger-template-details';
      break;
    case 'EventListener':
      routeName = 'event-listener-details';
      break;
    case 'ClusterInterceptor':
      routeName = 'clusterinterceptor-details';
      requiresNamespace = false;
      break;
    default:
      return kubeObject ? <Link kubeObject={kubeObject}>{name}</Link> : <span>{name}</span>;
  }

  const params: Record<string, string> = { name };
  const resourceNamespace = namespace || kubeObject?.metadata?.namespace;

  if (requiresNamespace && resourceNamespace) {
    params.namespace = resourceNamespace;
  }

  return (
    <Link routeName={routeName} params={params} activeCluster={kubeObject?.cluster}>
      {name}
    </Link>
  );
}
