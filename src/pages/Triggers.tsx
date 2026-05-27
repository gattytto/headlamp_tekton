// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/Triggers.tsx

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TriggerBindingClass } from '../crd/trigger';
import { TriggerTemplateClass } from '../crd/triggertemplate';
import { EventListenerClass } from '../crd/eventlistener';
import { LinkToResource } from '../components/LinkToResource';

export function TriggersPage() {
  return (
    <>
      <ResourceListView
        title="TriggerBindings"
        resourceClass={TriggerBindingClass}
        id="tekton-triggerbindings"
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: item => item.metadata.name,
            render: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="TriggerBinding"
                namespace={item.metadata.namespace}
                kubeObject={item}
              />
            ),
          },
          'cluster',
          'namespace',
          'age',
        ]}
      />

      <ResourceListView
        title="TriggerTemplates"
        resourceClass={TriggerTemplateClass}
        id="tekton-triggertemplates"
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: item => item.metadata.name,
            render: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="TriggerTemplate"
                namespace={item.metadata.namespace}
                kubeObject={item}
              />
            ),
          },
          'cluster',
          'namespace',
          'age',
        ]}
      />

      <ResourceListView
        title="EventListeners"
        resourceClass={EventListenerClass}
        id="tekton-triggers-eventlisteners"
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
          'age',
        ]}
      />
    </>
  );
}
