// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/crd/trigger.ts

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export class TriggerBindingClass extends KubeObject<KubeObjectInterface> {
  static apiVersion = ['triggers.tekton.dev/v1beta1'];
  static kind = 'TriggerBinding';
  static apiName = 'triggerbindings';
  static isNamespaced = true;
}

export class EventListenerClass extends KubeObject<KubeObjectInterface> {
  static apiVersion = ['triggers.tekton.dev/v1beta1'];
  static kind = 'EventListener';
  static apiName = 'eventlisteners';
  static isNamespaced = true;
}

export class ClusterInterceptorClass extends KubeObject<KubeObjectInterface> {
  static apiVersion = ['triggers.tekton.dev/v1beta1'];
  static kind = 'ClusterInterceptor';
  static apiName = 'clusterinterceptors';
  static isNamespaced = false;
}