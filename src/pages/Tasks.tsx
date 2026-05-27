// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/Tasks.tsx

import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TaskClass } from '../crd/task';
import { LinkToResource } from '../components/LinkToResource';

export function TasksPage() {
  const [items] = TaskClass.useList();

  if (!items) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <SectionBox title="Tasks">
      <SimpleTable
        data={items}
        emptyMessage="No Tasks found."
        columns={[
          {
            label: 'Name',
            getter: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="Task"
                namespace={item.metadata.namespace}
                kubeObject={item}
              />
            ),
          },
          {
            label: 'Steps',
            getter: item => item.spec?.steps?.length ?? 0,
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
