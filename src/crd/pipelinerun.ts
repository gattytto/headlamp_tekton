// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/stc/crd/pipelinerun.ts

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface PipelineRun extends KubeObjectInterface {
  spec: any;
  status?: any;
}

export class PipelineRunClass extends KubeObject<PipelineRun> {
  static apiVersion = ['tekton.dev/v1'];
  static kind = 'PipelineRun';
  static apiName = 'pipelineruns';
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }
}