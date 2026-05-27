// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/PipelineRuns.tsx

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineRunClass } from '../crd/pipelinerun';
import { LinkToResource } from '../components/LinkToResource';
import { TektonRerunMenuAction } from '../components/RunActions';
import { durationText } from './detailHelpers';

export function PipelineRunsPage() {
  return (
    <ResourceListView
      title="PipelineRuns"
      resourceClass={PipelineRunClass}
      id="tekton-pipelineruns"
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
              kind="PipelineRun"
              namespace={item.metadata.namespace}
              kubeObject={item}
            />
          ),
        },
        'cluster',
        'namespace',
        {
          id: 'pipeline',
          label: 'Pipeline',
          getValue: item => item.spec?.pipelineRef?.name ?? '-',
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
