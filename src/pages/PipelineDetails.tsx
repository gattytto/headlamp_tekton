// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/PipelineDetails.tsx

import { useParams } from 'react-router-dom';
import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { PipelineClass } from '../crd/pipeline';
import { RawJsonViewer } from './RawJSONViewer';

export function PipelineDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name) return <div style={{ padding: 16 }}>Invalid route</div>;

  return (
    <div style={{ padding: 16 }}>
      <DetailsGrid
        resourceType={PipelineClass}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'Tasks',
              value: item.spec?.tasks?.length ?? 0,
            },
          ]
        }
        extraSections={item =>
          item
            ? [
                {
                  id: 'tasks',
                  section: (
                    <SectionBox title="Tasks">
                      <ul>
                        {(item.spec?.tasks || []).map((t: any, i: number) => (
                          <li key={i}>
                            {t.name} → {t.taskRef?.name ?? 'inline'}
                          </li>
                        ))}
                      </ul>
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