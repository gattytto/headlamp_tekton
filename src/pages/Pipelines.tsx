// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/Pipelines.tsx

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineClass } from '../crd/pipeline';
import { LinkToResource } from '../components/LinkToResource';

export function PipelinesPage() {
  return (
    <ResourceListView
      title="Pipelines"
      resourceClass={PipelineClass}
      id="tekton-pipelines"
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.metadata.name,
          render: item => (
            <LinkToResource
              name={item.metadata.name}
              kind="Pipeline"
              namespace={item.metadata.namespace}
              kubeObject={item}
            />
          ),
        },
        'cluster',
        {
          id: 'tasks',
          label: 'Tasks',
          getValue: item => {
            const spec = item.spec ?? item.jsonData?.spec ?? {};
            return Array.isArray(spec?.tasks) ? spec.tasks.length : 0;
          },
        },
        'namespace',
        'age',
      ]}
    />
  );
}
