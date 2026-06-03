// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/Tasks.tsx

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TaskClass } from '../crd/task';
import { LinkToResource } from '../components/LinkToResource';

export function TasksPage() {
  return (
    <ResourceListView
      title="Tasks"
      resourceClass={TaskClass}
      id="tekton-tasks"
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.metadata.name,
          render: item => (
            <LinkToResource
              name={item.metadata.name}
              kind="Task"
              namespace={item.metadata.namespace}
              kubeObject={item}
            />
          ),
        },
        'cluster',
        {
          id: 'steps',
          label: 'Steps',
          getValue: item => item.spec?.steps?.length ?? 0,
        },
        'namespace',
        'age',
      ]}
    />
  );
}
