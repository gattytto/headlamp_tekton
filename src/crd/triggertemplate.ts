// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/crd/triggertemplate.ts

import {
  KubeObject,
  KubeObjectInterface,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface TriggerTemplate extends KubeObjectInterface {
  spec: {
    params?: {
      name: string;
      default?: string;
      description?: string;
    }[];
    resourcetemplates?: any[]; // contains embedded K8s resources (e.g. PipelineRun)
  };
}

export class TriggerTemplateClass extends KubeObject<TriggerTemplate> {
  static apiVersion = ['triggers.tekton.dev/v1beta1'];
  static kind = 'TriggerTemplate';
  static apiName = 'triggertemplates';
  static isNamespaced = true;

  static get detailsRoute() {
    return 'trigger-template-details';
  }

  static get listRoute() {
    return 'Triggers';
  }

  get spec() {
    return this.jsonData.spec;
  }
}
