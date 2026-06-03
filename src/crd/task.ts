// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/crd/task.ts

import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface Task extends KubeObjectInterface {
  spec: any;
}

export class TaskClass extends KubeObject<Task> {
  static apiVersion = ['tekton.dev/v1'];
  static kind = 'Task';
  static apiName = 'tasks';
  static isNamespaced = true;

  static get detailsRoute() {
    return 'task-details';
  }

  static get listRoute() {
    return 'Tasks';
  }

  get spec() {
    return this.jsonData.spec;
  }
}
