// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/ClusterInterceptorDetails.tsx
import { useParams } from 'react-router-dom';
import { DetailsGrid, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterInterceptorClass } from '../crd/clusterinterceptor';
import { extraSectionsFor, mainInfoRows } from './detailHelpers';

export function ClusterInterceptorDetailsPage() {
  const { name } = useParams<{ name: string }>();

  if (!name) return <SectionBox title="Details">Invalid route</SectionBox>;

  return (
    <DetailsGrid
      resourceType={ClusterInterceptorClass}
      name={name}
      withEvents
      extraInfo={item => item && mainInfoRows(item)}
      extraSections={item => (item ? extraSectionsFor(item) : [])}
    />
  );
}
