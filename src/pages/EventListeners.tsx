// SPDX-License-Identifier: EPL-2.0

import { SectionBox, SimpleTable, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { EventListenerClass } from '../crd/eventlistener';
import { LinkToResource } from '../components/LinkToResource';

function eventListenerStatus(item: any) {
  const condition = item.status?.conditions?.[0];
  if (!condition) return <StatusLabel status="">Unknown</StatusLabel>;
  if (condition.status === 'True') {
    return <StatusLabel status="success">{condition.reason || condition.type || 'Ready'}</StatusLabel>;
  }
  if (condition.status === 'False') {
    return <StatusLabel status="error">{condition.reason || condition.type || 'Not Ready'}</StatusLabel>;
  }
  return <StatusLabel status="warning">{condition.reason || condition.type || condition.status}</StatusLabel>;
}

export function EventListenersPage() {
  const [items] = EventListenerClass.useList();

  if (!items) {
    return <SectionBox title="EventListeners">Loading...</SectionBox>;
  }

  return (
    <SectionBox title="EventListeners">
      <SimpleTable
        data={items}
        emptyMessage="No EventListeners found."
        columns={[
          {
            label: 'Name',
            getter: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="EventListener"
                namespace={item.metadata.namespace}
                kubeObject={item}
              />
            ),
          },
          {
            label: 'Namespace',
            getter: item => item.metadata.namespace || '-',
          },
          {
            label: 'Triggers',
            getter: item => item.spec?.triggers?.length ?? 0,
          },
          {
            label: 'Service Account',
            getter: item => item.spec?.serviceAccountName || item.spec?.taskRunTemplate?.serviceAccountName || '-',
          },
          {
            label: 'Status',
            getter: item => eventListenerStatus(item),
          },
          {
            label: 'Address',
            getter: item => item.status?.address?.url || '-',
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
