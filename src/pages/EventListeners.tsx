// SPDX-License-Identifier: EPL-2.0

import { ResourceListView, SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
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
    <ResourceListView
      title="EventListeners"
      data={items}
      id="tekton-eventlisteners"
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.metadata.name,
          render: item => (
            <LinkToResource
              name={item.metadata.name}
              kind="EventListener"
              namespace={item.metadata.namespace}
              kubeObject={item}
            />
          ),
        },
        'cluster',
        'namespace',
        {
          id: 'triggers',
          label: 'Triggers',
          getValue: item => item.spec?.triggers?.length ?? 0,
        },
        {
          id: 'service-account',
          label: 'Service Account',
          getValue: item => item.spec?.serviceAccountName || item.spec?.taskRunTemplate?.serviceAccountName || '-',
        },
        {
          id: 'status',
          label: 'Status',
          getValue: item => item.status?.conditions?.[0]?.reason ?? 'Unknown',
          render: item => eventListenerStatus(item),
        },
        {
          id: 'address',
          label: 'Address',
          getValue: item => item.status?.address?.url || '-',
        },
        'age',
      ]}
    />
  );
}
