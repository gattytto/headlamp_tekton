// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/ClusterInterceptors.tsx

import {
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterInterceptorClass } from '../crd/clusterinterceptor';
import { LinkToResource } from '../components/LinkToResource';

export function ClusterInterceptorsPage() {
  const [items] = ClusterInterceptorClass.useList();

  if (!items) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <SectionBox title="ClusterInterceptors">
      <SimpleTable
        data={items}
        emptyMessage="No ClusterInterceptors found."
        columns={[
          {
            label: 'Name',
            getter: item => (
              <LinkToResource
                name={item.metadata.name}
                kind="ClusterInterceptor"
                kubeObject={item}
              />
            ),
          },
          {
            label: 'ClientConfig',
            getter: item =>
              item.spec?.clientConfig?.service?.name ??
              item.spec?.clientConfig?.url ??
              '-',
          },
          {
            label: 'Age',
            getter: item => item.metadata?.creationTimestamp ?? '-',
          },
        ]}
      />
    </SectionBox>
  );
}
