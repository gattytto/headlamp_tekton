// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/crd/trigger.ts

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export class TriggerBindingClass extends KubeObject<KubeObjectInterface> {
  static apiVersion = ['triggers.tekton.dev/v1beta1', 'triggers.tekton.dev/v1alpha1'];
  static kind = 'TriggerBinding';
  static apiName = 'triggerbindings';
  static isNamespaced = true;

  static get detailsRoute() {
    return 'trigger-binding-details';
  }

  static get listRoute() {
    return 'Triggers';
  }
}
