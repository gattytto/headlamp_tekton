// SPDX-License-Identifier: EPL-2.0

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface ConcolorPolicyProfile extends KubeObjectInterface {
  spec: any;
  status?: {
    generatedCalicoPolicy?: {
      apiVersion: string;
      kind: string;
      name: string;
      namespace?: string;
    };
    selectorLabel?: {
      key: string;
      value: string;
    };
  };
}

export class ConcolorPolicyProfileClass extends KubeObject<ConcolorPolicyProfile> {
  static apiVersion = ['concolor.projectcalico.org/v1alpha1'];
  static kind = 'ConcolorPolicyProfile';
  static apiName = 'concolorpolicyprofiles';
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}
