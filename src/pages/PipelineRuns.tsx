// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/PipelineRuns.tsx

import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineRunClass } from '../crd/pipelinerun';
import { LinkToResource } from '../components/LinkToResource';
import { TektonRunActions } from '../components/RunActions';
import { durationText } from './detailHelpers';

export function PipelineRunsPage() {
  const [items] = PipelineRunClass.useList();

  if (!items) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <SectionBox title="PipelineRuns">
      <SimpleTable
        data={items}
        emptyMessage="No PipelineRuns found."
        columns={[
          {
            label: 'Name',
            getter: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="PipelineRun"
                namespace={item.metadata.namespace}
                kubeObject={item}
              />
            ),
          },
          {
            label: 'Pipeline',
            getter: item => item.spec?.pipelineRef?.name ?? '-',
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
          {
            label: 'Actions',
            getter: item => <TektonRunActions item={item} variant="compact" />,
          },
        ]}
      />
    </SectionBox>
  );
}
