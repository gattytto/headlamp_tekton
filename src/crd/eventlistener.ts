// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/crd/eventlistener.ts

import {
  KubeObject,
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface EventListener extends KubeObjectInterface {
  spec: {
    serviceAccountName?: string;
    triggers?: any[];
  };
}

export class EventListenerClass extends KubeObject<EventListener> {
  static apiVersion = ['triggers.tekton.dev/v1beta1'];
  static kind = 'EventListener';
  static apiName = 'eventlisteners';
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }
}