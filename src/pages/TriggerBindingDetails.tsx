// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/TriggerBindingDetails.tsx

import { useParams } from 'react-router-dom';
import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { TriggerBindingClass } from '../crd/trigger';
import { RawJsonViewer } from './RawJSONViewer';

export function TriggerBindingDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name) return <div style={{ padding: 16 }}>Invalid route</div>;

  return (
    <div style={{ padding: 16 }}>
      <DetailsGrid
        resourceType={TriggerBindingClass}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item => {
          if (!item) return [];

          const spec = item.spec ?? item.jsonData?.spec ?? {};

          return [
            {
              name: 'Params Count',
              value: Array.isArray(spec?.params)
                ? spec.params.length
                : 0,
            },
          ];
        }}
        extraSections={item => {
          if (!item) return [];

          const spec = item.spec ?? item.jsonData?.spec ?? {};

          return [
            {
              id: 'params',
              section: (
                <SectionBox title="Params">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 1fr',
                      rowGap: 6,
                      columnGap: 12,
                      fontSize: 13,
                    }}
                  >
                    {(spec?.params ?? []).map((p: any) => (
                      <>
                        <div style={{ fontWeight: 600 }}>
                          {p.name ?? '-'}
                        </div>
                        <div>{p.value ?? '-'}</div>
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