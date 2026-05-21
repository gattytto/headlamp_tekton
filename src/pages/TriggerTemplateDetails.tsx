// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/pages/TriggerTemplateDetails.tsx

import { useParams } from 'react-router-dom';
import {
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { TriggerTemplateClass } from '../crd/triggertemplate';
import { RawJsonViewer } from './RawJSONViewer';

export function TriggerTemplateDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name) return <div style={{ padding: 16 }}>Invalid route</div>;

  return (
    <div style={{ padding: 16 }}>
      <DetailsGrid
        resourceType={TriggerTemplateClass}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'Params',
              value: item.spec?.params?.length ?? 0,
            },
            {
              name: 'Resources',
              value: item.spec?.resourcetemplates?.length ?? 0,
            },
          ]
        }
        extraSections={item =>
          item
            ? [
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