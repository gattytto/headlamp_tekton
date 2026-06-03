// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/crd/clusterinterceptor.ts

import {
  KubeObject,
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface ClusterInterceptor extends KubeObjectInterface {
  spec: {
    clientConfig?: any;
    params?: any[];
  };
}

export class ClusterInterceptorClass extends KubeObject<ClusterInterceptor> {
  static apiVersion = ['triggers.tekton.dev/v1alpha1'];
  static kind = 'ClusterInterceptor';
  static apiName = 'clusterinterceptors';
  static isNamespaced = false;

  static get detailsRoute() {
    return 'clusterinterceptor-details';
  }

  static get listRoute() {
    return 'ClusterInterceptors';
  }

  get spec() {
    return this.jsonData.spec;
  }
}
