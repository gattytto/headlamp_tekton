// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/TaskDetails.tsx

import { useParams } from 'react-router-dom';
import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { TaskClass } from '../crd/task';
import { RawJsonViewer } from './RawJSONViewer';

export function TaskDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name) return <div style={{ padding: 16 }}>Invalid route</div>;

  return (
    <div style={{ padding: 16 }}>
      <DetailsGrid
        resourceType={TaskClass}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'Steps',
              value: item.spec?.steps?.length ?? 0,
            },
          ]
        }
        extraSections={item =>
          item
            ? [
                {
                  id: 'steps',
                  section: (
                    <SectionBox title="Steps">
                      <ul>
                        {(item.spec?.steps || []).map((s: any, i: number) => (
                          <li key={i}>{s.name}</li>
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