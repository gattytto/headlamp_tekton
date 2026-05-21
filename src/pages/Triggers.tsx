// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/Triggers.tsx

import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TriggerBindingClass } from '../crd/trigger';
import { TriggerTemplateClass } from '../crd/triggertemplate';
import { EventListenerClass } from '../crd/eventlistener';
import { LinkToResource } from '../components/LinkToResource';

export function TriggersPage() {
  const [bindings] = TriggerBindingClass.useList();
  const [templates] = TriggerTemplateClass.useList();
  const [listeners] = EventListenerClass.useList();

  if (!bindings || !templates || !listeners) {
    return <div style={{ padding: 16 }}>Loading...</div>;
  }

  return (
    <>
      <SectionBox title="TriggerBindings">
        <SimpleTable
          data={bindings}
          columns={[
            {
              label: 'Name',
              getter: item => (
                <LinkToResource
                  name={item.metadata.name}
                  kind="TriggerBinding"
                  namespace={item.metadata.namespace}
                />
              ),
            },
          ]}
        />
      </SectionBox>

      <SectionBox title="TriggerTemplates">
        <SimpleTable
          data={templates}
          columns={[
            {
              label: 'Name',
              getter: item => (
                <LinkToResource
                  name={item.metadata.name}
                  kind="TriggerTemplate"
                  namespace={item.metadata.namespace}
                />
              ),
            },
          ]}
        />
      </SectionBox>

      <SectionBox title="EventListeners">
        <SimpleTable
          data={listeners}
          columns={[
            {
              label: 'Name',
              getter: item => (
                <LinkToResource
                  name={item.metadata.name}
                  kind="EventListener"
                  namespace={item.metadata.namespace}
                />
              ),
            },
          ]}
        />
      </SectionBox>
    </>
  );
}