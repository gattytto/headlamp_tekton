// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/TaskRuns.tsx

import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TaskRunClass } from '../crd/taskrun';
import { LinkToResource } from '../components/LinkToResource';
import { durationText } from './detailHelpers';

export function TaskRunsPage() {
  const [items] = TaskRunClass.useList();

  if (!items) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <SectionBox title="TaskRuns">
      <SimpleTable
        data={items}
        emptyMessage="No TaskRuns found."
        columns={[
          {
            label: 'Name',
            getter: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="TaskRun"
                namespace={item.metadata.namespace}
                kubeObject={item}
              />
            ),
          },
          {
            label: 'Task',
            getter: item => item.spec?.taskRef?.name ?? '-',
          },
          {
            label: 'Status',
            getter: item =>
              item.status?.conditions?.[0]?.reason ?? 'Unknown',
          },
          {
            label: 'Duration',
            getter: item => durationText(item.status?.startTime, item.status?.completionTime),
          },
          {
            label: 'Age',
            getter: item => item.metadata?.creationTimestamp ?? '-',
          },
        ]}
      />
    </SectionBox>
  );
}
