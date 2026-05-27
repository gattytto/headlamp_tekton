// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/crd/eventlistener.ts

import {
  KubeObject,
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface EventListener extends KubeObjectInterface {
  spec: {
    serviceAccountName?: string;
    taskRunTemplate?: {
      serviceAccountName?: string;
    };
    namespaceSelector?: any;
    triggers?: any[];
  };
  status?: any;
}

export class EventListenerClass extends KubeObject<EventListener> {
  static apiVersion = ['triggers.tekton.dev/v1beta1', 'triggers.tekton.dev/v1alpha1'];
  static kind = 'EventListener';
  static apiName = 'eventlisteners';
  static isNamespaced = true;

  static get detailsRoute() {
    return 'event-listener-details';
  }

  static get listRoute() {
    return 'EventListeners';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}
