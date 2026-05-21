// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/ClusterInterceptorDetails.tsx

import { useParams } from 'react-router-dom';
import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterInterceptorClass } from '../crd/clusterinterceptor';
import { RawJsonViewer } from './RawJSONViewer';

export function ClusterInterceptorDetailsPage() {
  const { name } = useParams<{ name: string }>();

  if (!name) return <div style={{ padding: 16 }}>Invalid route</div>;

  return (
    <div style={{ padding: 16 }}>
      <DetailsGrid
        resourceType={ClusterInterceptorClass}
        name={name}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'Has ClientConfig',
              value: item.spec?.clientConfig ? 'Yes' : 'No',
            },
            {
              name: 'Params',
              value: item.spec?.params?.length ?? 0,
            },
          ]
        }
        extraSections={item =>
          item
            ? [
                {
                  id: 'clientConfig',
                  section: (
                    <SectionBox title="Client Config">
                      <RawJsonViewer data={item.spec?.clientConfig} />
                    </SectionBox>
                  ),
                },
                {
                  id: 'params',
                  section: (
                    <SectionBox title="Params">
                      <RawJsonViewer data={item.spec?.params} />
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