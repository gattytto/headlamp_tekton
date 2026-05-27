// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/crd/taskrun.ts

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface TaskRun extends KubeObjectInterface {
  spec: any;
  status?: any;
}

export class TaskRunClass extends KubeObject<TaskRun> {
  static apiVersion = ['tekton.dev/v1'];
  static kind = 'TaskRun';
  static apiName = 'taskruns';
  static isNamespaced = true;

  static get detailsRoute() {
    return 'taskrun-details';
  }

  static get listRoute() {
    return 'TaskRuns';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}
