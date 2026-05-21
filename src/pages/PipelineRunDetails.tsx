// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/PipelineRunRetails.tsx

import { useParams } from 'react-router-dom';
import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineRunClass } from '../crd/pipelinerun';
import { RawJsonViewer } from './RawJSONViewer';

export function PipelineRunDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name) return <div style={{ padding: 16 }}>Invalid route</div>;

  return (
    <div style={{ padding: 16 }}>
      <DetailsGrid
        resourceType={PipelineRunClass}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'Pipeline',
              value: item.spec?.pipelineRef?.name ?? '-',
            },
            {
              name: 'Status',
              value: item.status?.conditions?.[0]?.type ?? '-',
            },
          ]
        }
        extraSections={item =>
          item
            ? [
                {
                  id: 'status',
                  section: (
                    <SectionBox title="Status">
                      <RawJsonViewer data={item.status} />
                    </SectionBox>
                  ),
                },
                {
                  id: 'raw',
                  section: (
                    <SectionBox title="Raw Spec">
                      <RawJsonViewer data={item.spec} />
                    </SectionBox>
                  ),
                },
              ]
            : []
        }
      />
    </div>
  );
}