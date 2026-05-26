// SPDX-License-Identifier: EPL-2.0

import { useParams } from 'react-router-dom';
import { DetailsGrid, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TriggerBindingClass } from '../crd/trigger';
import { extraSectionsFor, mainInfoRows } from './detailHelpers';

export function TriggerBindingDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name || !namespace) return <SectionBox title="Details">Invalid route</SectionBox>;

  return (
    <DetailsGrid
      resourceType={TriggerBindingClass}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item => item && mainInfoRows(item)}
      extraSections={item => (item ? extraSectionsFor(item) : [])}
    />
  );
}
