// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/EventListenerDetails.tsx

import { useParams } from 'react-router-dom';
import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { EventListenerClass } from '../crd/trigger';
import { RawJsonViewer } from './RawJSONViewer';

export function EventListenerDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name) return <div style={{ padding: 16 }}>Invalid route</div>;

  return (
    <div style={{ padding: 16 }}>
      <DetailsGrid
        resourceType={EventListenerClass}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item => {
          if (!item) return [];

          const spec = item.spec ?? item.jsonData?.spec ?? {};

          return [
            {
              name: 'Triggers',
              value: Array.isArray(spec?.triggers)
                ? spec.triggers.length
                : 0,
            },
          ];
        }}
        extraSections={item => {
          if (!item) return [];

          const spec = item.spec ?? item.jsonData?.spec ?? {};

          return [
            {
              id: 'triggers',
              section: (
                <SectionBox title="Triggers">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 1fr',
                      rowGap: 6,
                      columnGap: 12,
                      fontSize: 13,
                    }}
                  >
                    {(spec?.triggers ?? []).map((t: any, i: number) => (
                      <>
                        <div style={{ fontWeight: 600 }}>
                          {t.name ?? `trigger-${i}`}
                        </div>
                        <div>
                          Template:{' '}
                          {t.template?.name ??
                            t.template?.ref ??
                            '-'}
                        </div>
                      </>
                    ))}
                  </div>
                </SectionBox>
              ),
            },
            {
              id: 'raw',
              section: (
                <SectionBox title="Raw Spec">
                  <RawJsonViewer data={spec} />
                </SectionBox>
              ),
            },
          ];
        }}
      />
    </div>
  );
}