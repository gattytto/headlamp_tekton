// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/TaskDetails.tsx
import { useParams } from 'react-router-dom';
import { DetailsGrid, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { TaskClass } from '../crd/task';
import { extraSectionsFor, mainInfoRows } from './detailHelpers';

export function TaskDetailsPage() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  if (!name || !namespace) return <SectionBox title="Details">Invalid route</SectionBox>;

  return (
    <DetailsGrid
      resourceType={TaskClass}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item => item && mainInfoRows(item)}
      extraSections={item => (item ? extraSectionsFor(item) : [])}
    />
  );
}
