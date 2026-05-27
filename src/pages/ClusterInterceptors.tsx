// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/ClusterInterceptors.tsx

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterInterceptorClass } from '../crd/clusterinterceptor';
import { LinkToResource } from '../components/LinkToResource';

export function ClusterInterceptorsPage() {
  return (
    <ResourceListView
      title="ClusterInterceptors"
      resourceClass={ClusterInterceptorClass}
      id="tekton-clusterinterceptors"
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: item => item.metadata.name,
          render: item => (
            <LinkToResource
              name={item.metadata.name}
              kind="ClusterInterceptor"
              kubeObject={item}
            />
          ),
        },
        'cluster',
        {
          id: 'client-config',
          label: 'ClientConfig',
          getValue: item =>
            item.spec?.clientConfig?.service?.name ??
            item.spec?.clientConfig?.url ??
            '-',
        },
        'age',
      ]}
    />
  );
}
