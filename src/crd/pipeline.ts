// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/crd/pipeline.ts

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface Pipeline extends KubeObjectInterface {
  spec: any;
}

export class PipelineClass extends KubeObject<Pipeline> {
  static apiVersion = ['tekton.dev/v1'];
  static kind = 'Pipeline';
  static apiName = 'pipelines';
  static isNamespaced = true;

  static get detailsRoute() {
    return 'pipeline-details';
  }

  static get listRoute() {
    return 'Pipelines';
  }

  get spec() {
    return this.jsonData.spec;
  }
}
