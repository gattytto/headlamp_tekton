// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/Pipelines.tsx

import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineClass } from '../crd/pipeline';
import { LinkToResource } from '../components/LinkToResource';

export function PipelinesPage() {
  const [items] = PipelineClass.useList();

  if (!items) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <SectionBox title="Pipelines">
      <SimpleTable
        data={items}
        emptyMessage="No Pipelines found."
        columns={[
          {
            label: 'Name',
            getter: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="Pipeline"
                namespace={item.metadata.namespace}
                kubeObject={item}
              />
            ),
          },
          {
            label: 'Tasks',
            getter: item => {
              const spec = item.spec ?? item.jsonData?.spec ?? {};
              return Array.isArray(spec?.tasks) ? spec.tasks.length : 0;
            },
          },
          {
            label: 'Namespace',
            getter: item => item.metadata?.namespace ?? '-',
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
