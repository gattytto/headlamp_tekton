// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/EventListenerDetails.tsx
import { useParams } from 'react-router-dom';
import { DetailsGrid, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { EventListenerClass } from '../crd/eventlistener';
import { extraSectionsFor, mainInfoRows } from './detailHelpers';

export function EventListenerDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name || !namespace) return <SectionBox title="Details">Invalid route</SectionBox>;

  return (
    <DetailsGrid
      resourceType={EventListenerClass}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item => item && mainInfoRows(item)}
      extraSections={item => (item ? extraSectionsFor(item) : [])}
    />
  );
}
