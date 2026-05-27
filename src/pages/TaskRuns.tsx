// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/TaskRuns.tsx

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TaskRunClass } from '../crd/taskrun';
import { LinkToResource } from '../components/LinkToResource';
import { TektonRerunMenuAction } from '../components/RunActions';
import { durationText } from './detailHelpers';

export function TaskRunsPage() {
  const [items] = TaskRunClass.useList();

  if (!items) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <ResourceListView
      title="TaskRuns"
      data={items}
      id="tekton-taskruns"
      actions={[
        {
          id: 'tekton-rerun',
          action: ({ item, closeMenu }) => <TektonRerunMenuAction item={item} closeMenu={closeMenu} />,
        },
      ]}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.metadata.name,
          render: item => (
            <LinkToResource
              name={item.metadata.name}
              kind="TaskRun"
              namespace={item.metadata.namespace}
              kubeObject={item}
            />
          ),
        },
        'cluster',
        'namespace',
        {
          id: 'task',
          label: 'Task',
          getValue: item => item.spec?.taskRef?.name ?? '-',
        },
        {
          id: 'status',
          label: 'Status',
          getValue: item => item.status?.conditions?.[0]?.reason ?? 'Unknown',
        },
        {
          id: 'duration',
          label: 'Duration',
          getValue: item => durationText(item.status?.startTime, item.status?.completionTime),
        },
        'age',
      ]}
    />
  );
}
