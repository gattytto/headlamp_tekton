// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/map/tektonGraphBuilder.tsx
//
// Builds a left-to-right Tekton graph for Headlamp's Resource Map:
// EventListener -> Trigger -> TriggerTemplate -> Pipeline -> Task|VirtualTask -> TaskRun -> PipelineRun
//
// Important choices:
// - spec.tasks[] and spec.finally[] are both treated as Pipeline task entries.
// - taskRef.name/kind=Task links to a real Task CR.
// - taskRef.resolver creates a virtual Task node because no in-cluster Task CR exists.
// - duplicate visual edges are collapsed because Headlamp does not render edge labels;
//   if one Pipeline calls the same Task twice, the map should still show one Pipeline -> Task line.
// - namespace filtering is done in tektonSource; this builder only removes dangling edges.

import React from "react";
import {
  GraphEdge,
  GraphNode,
} from "@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel";
import { Icon } from "@iconify/react";
import { NodeDetails } from "../components/NodeDetails";

type Args = {
  pipelines?: any[];
  pipelineRuns?: any[];
  tasks?: any[];
  taskRuns?: any[];
  bindings?: any[];
  templates?: any[];
  listeners?: any[];
  interceptors?: any[];
  concolorProfiles?: any[];
  suppressConcolorPolicyRuntimeEdges?: boolean;
  activeConcolorPolicyKinds?: {
    NetworkPolicy?: boolean;
    StagedNetworkPolicy?: boolean;
  };
  includeSteps?: boolean;

  // Accepted for compatibility with existing callers. Filtering happens in tektonSource.
  selectedNamespace?: string;
  selectedNamespaces?: string[];
};

type NodeKind =
  | "Pipeline"
  | "PipelineRun"
  | "Task"
  | "TaskRun"
  | "Step"
  | "EventListener"
  | "Trigger"
  | "TriggerTemplate"
  | "TriggerBinding"
  | "ClusterTriggerBinding"
  | "ClusterInterceptor";

type TektonNode = GraphNode & { namespace?: string; type?: string; data?: any };

const tektonIcon = <Icon icon="custom:tekton" />;

// Label keys used to correlate Tekton resources and normalize Headlamp grouping.
// Keeping them centralized avoids repeated string literals in the resolver logic.
const L = {
  instance: "app.kubernetes.io/instance",
  partOf: "app.kubernetes.io/part-of",
  component: "app.kubernetes.io/component",
  pipeline: "tekton.dev/pipeline",
  pipelineName: "tekton.dev/pipeline-name",
  pipelineRun: "tekton.dev/pipelineRun",
  pipelineRunAlt: "tekton.dev/pipeline-run",
  pipelineTask: "tekton.dev/pipelineTask",
  pipelineTaskAlt: "tekton.dev/pipeline-task",
  task: "tekton.dev/task",
  concolorPolicyPrefix: "concolor.projectcalico.org/policy.",
} as const;

const meta = (o: any) => o?.metadata || o?.jsonData?.metadata || o?._jsonData?.metadata || {};
const labels = (o: any): Record<string, string> => meta(o).labels || {};
const annotations = (o: any): Record<string, string> =>
  meta(o).annotations || {};
const nameOf = (o: any) => meta(o).name || "";
const nsOf = (o: any) => meta(o).namespace || "default";
const clusterOf = (o: any) => o?.cluster || o?._clusterName || "cluster";
const key = (cluster: string, ns: string, name: string) => `${cluster}/${ns}/${name}`;
const first = (...values: Array<string | undefined>) => values.find(Boolean);
const owner = (o: any, kind: string) =>
  (meta(o).ownerReferences || []).find((ref: any) => ref?.kind === kind)?.name;

const id = (kind: string, ...parts: Array<string | number | undefined>) =>
  [kind, ...parts.filter((v) => v !== undefined && v !== "")].join("-");

// Stable Resource Map node ID builders.
// IDs include kind + cluster + namespace + name so edges stay valid across refreshes.
// Cluster-scoped resources intentionally omit namespace, but still include cluster.
const ID = {
  pipeline: (cluster: string, ns: string, name: string) => id("pipeline", cluster, ns, name),
  pipelineRun: (cluster: string, ns: string, name: string) => id("pipelinerun", cluster, ns, name),
  task: (cluster: string, ns: string, name: string) => id("task", cluster, ns, name),
  taskRun: (cluster: string, ns: string, name: string) => id("taskrun", cluster, ns, name),
  virtualTask: (cluster: string, ns: string, pipeline: string, task: string) =>
    id("virtualtask", cluster, ns, pipeline, task),
  eventListener: (cluster: string, ns: string, name: string) => id("eventlistener", cluster, ns, name),
  trigger: (cluster: string, ns: string, listener: string, trigger: string, index: number) =>
    id("trigger", cluster, ns, listener, trigger, index),
  triggerTemplate: (cluster: string, ns: string, name: string) =>
    id("triggertemplate", cluster, ns, name),
  triggerBinding: (cluster: string, ns: string, name: string) => id("triggerbinding", cluster, ns, name),
  clusterTriggerBinding: (cluster: string, name: string) =>
    id("clustertriggerbinding", cluster, name),
  clusterInterceptor: (cluster: string, name: string) =>
    id("clusterinterceptor", cluster, name),
  step: (cluster: string, ns: string, task: string, step: string, index: number) =>
    id("step", cluster, ns, task, step, index),
};

const pipelineEntries = (pipeline: any) => [
  ...(pipeline?.spec?.tasks || []),
  ...(pipeline?.spec?.finally || []),
];

const taskRef = (entry: any) => entry?.taskRef || {};
const entryName = (entry: any) =>
  entry?.name || taskRef(entry).name || taskRef(entry).resolver || "task";
const isResolverEntry = (entry: any) => Boolean(taskRef(entry).resolver);
const isConcreteTaskEntry = (entry: any) =>
  Boolean(
    taskRef(entry).name &&
    !taskRef(entry).resolver &&
    (!taskRef(entry).kind || taskRef(entry).kind === "Task"),
  );

function pipelineRunNameForTaskRun(taskRun: any) {
  return first(
    owner(taskRun, "PipelineRun"),
    labels(taskRun)[L.pipelineRun],
    labels(taskRun)[L.pipelineRunAlt],
    annotations(taskRun)[L.pipelineRun],
  );
}

function pipelineNameForTaskRunLabel(taskRun: any) {
  return first(
    labels(taskRun)[L.pipeline],
    labels(taskRun)[L.pipelineName],
    annotations(taskRun)[L.pipeline],
  );
}

function pipelineTaskNameForTaskRun(taskRun: any) {
  return first(
    labels(taskRun)[L.pipelineTask],
    labels(taskRun)[L.pipelineTaskAlt],
    annotations(taskRun)[L.pipelineTask],
  );
}

function taskNameForTaskRun(taskRun: any) {
  return first(
    taskRun?.spec?.taskRef?.name,
    labels(taskRun)[L.task],
    annotations(taskRun)[L.task],
  );
}

function hasPolicyMediatedPipelineRunEdge(
  taskRun: any,
  pipelineRun: any,
  profiles: any[],
  activePolicyKinds?: Args["activeConcolorPolicyKinds"],
) {
  if (!pipelineRun) {
    return false;
  }

  const taskRunLabels = labels(taskRun);
  const pipelineRunLabels = labels(pipelineRun);
  const selectors = profiles
    .filter((profile) => {
      const policyKind = profile?.status?.generatedCalicoPolicy?.kind;
      if (!policyKind) return false;
      if (!activePolicyKinds) return true;
      return Boolean(activePolicyKinds[policyKind as keyof typeof activePolicyKinds]);
    })
    .map((profile) => profile?.status?.selectorLabel)
    .filter((selector) => selector?.key && selector?.value);

  if (selectors.length > 0) {
    return selectors.some(
      (selector) =>
        taskRunLabels[selector.key] === selector.value &&
        pipelineRunLabels[selector.key] === selector.value,
    );
  }

  if (activePolicyKinds) {
    return false;
  }

  const concolorLabels = Object.entries(taskRunLabels).filter(([label]) =>
    label.startsWith(L.concolorPolicyPrefix),
  );
  return concolorLabels.some(
    ([label, value]) => pipelineRunLabels[label] === value,
  );
}

function pipelineNameForRun(pipelineRun: any, namespacePipelines: any[]) {
  const explicit = first(
    pipelineRun?.spec?.pipelineRef?.name,
    labels(pipelineRun)[L.pipeline],
    annotations(pipelineRun)[L.pipeline],
    owner(pipelineRun, "Pipeline"),
  );
  if (explicit) return explicit;

  // Tekton generated names often start with the Pipeline name.
  const runName = nameOf(pipelineRun);
  const prefixMatch = namespacePipelines
    .map(nameOf)
    .filter((name) => runName === name || runName.startsWith(`${name}-`))
    .sort((a, b) => b.length - a.length)[0];
  if (prefixMatch) return prefixMatch;

  // Last safe fallback: a namespace with one Pipeline and at least one PipelineRun.
  return namespacePipelines.length === 1
    ? nameOf(namespacePipelines[0])
    : undefined;
}

function matchesPipelineEntry(
  entry: any,
  taskRun: any,
  pipelineRunName?: string,
) {
  const generatedSuffix =
    pipelineRunName && nameOf(taskRun).startsWith(`${pipelineRunName}-`)
      ? nameOf(taskRun).slice(pipelineRunName.length + 1)
      : undefined;

  return Boolean(
    (pipelineTaskNameForTaskRun(taskRun) &&
      entry?.name === pipelineTaskNameForTaskRun(taskRun)) ||
    (taskNameForTaskRun(taskRun) &&
      taskRef(entry).name === taskNameForTaskRun(taskRun)) ||
    (generatedSuffix &&
      (generatedSuffix === entry?.name ||
        generatedSuffix.startsWith(`${entry?.name}-`))),
  );
}

function targetForPipelineEntry(
  cluster: string,
  namespace: string,
  pipelineName: string,
  entry: any,
) {
  if (isResolverEntry(entry))
    return ID.virtualTask(cluster, namespace, pipelineName, entryName(entry));
  if (isConcreteTaskEntry(entry))
    return ID.task(cluster, namespace, taskRef(entry).name);
  return undefined;
}

function targetForTaskRun(
  taskRun: any,
  pipelineName: string | undefined,
  pipelinesByKey: Map<string, any>,
) {
  const cluster = clusterOf(taskRun);
  const namespace = nsOf(taskRun);
  const pipeline = pipelineName
    ? pipelinesByKey.get(key(cluster, namespace, pipelineName))
    : undefined;
  const pipelineRunName = pipelineRunNameForTaskRun(taskRun);
  const entry = pipelineEntries(pipeline).find((e) =>
    matchesPipelineEntry(e, taskRun, pipelineRunName),
  );
  const pipelineTarget =
    pipelineName && entry
      ? targetForPipelineEntry(cluster, namespace, pipelineName, entry)
      : undefined;

  if (pipelineTarget) return pipelineTarget;

  // Fallbacks keep standalone TaskRuns and older Tekton labels useful.
  const explicitTask = taskNameForTaskRun(taskRun);
  if (explicitTask) return ID.task(cluster, namespace, explicitTask);
  if (pipelineName && taskRun?.spec?.taskRef?.resolver) {
    return ID.virtualTask(
      cluster,
      namespace,
      pipelineName,
      pipelineTaskNameForTaskRun(taskRun) || nameOf(taskRun),
    );
  }
  return undefined;
}

function triggerTemplatePipelineRefs(template: any) {
  const resourceTemplates =
    template?.spec?.resourceTemplates ||
    template?.spec?.resourcetemplates ||
    [];
  return Array.from(
    new Set(
      resourceTemplates
        .map((rt: any) => rt?.spec?.pipelineRef?.name)
        .filter(Boolean),
    ),
  );
}

function triggerTemplateRef(trigger: any, defaultNamespace: string) {
  const template = trigger?.template || {};
  const name =
    template?.ref?.name ||
    template?.ref ||
    template?.name ||
    template?.resource ||
    "";
  const namespace =
    template?.ref?.namespace ||
    template?.namespace ||
    defaultNamespace;

  return { namespace, name };
}

function groupByNamespace(items: any[]) {
  const grouped = new Map<string, any[]>();
  items.forEach((item) => {
    const groupKey = `${clusterOf(item)}/${nsOf(item)}`;
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey)!.push(item);
  });
  return grouped;
}

function indexByNamespaceName(items: any[]) {
  const indexed = new Map<string, any>();
  items.forEach((item) => indexed.set(key(clusterOf(item), nsOf(item), nameOf(item)), item));
  return indexed;
}

function normalizeForHeadlamp(
  kubeObject: any,
  namespace?: string,
  component?: string,
  kind?: NodeKind,
) {
  if (!kubeObject) return kubeObject;

  const ns = namespace || meta(kubeObject).namespace;
  const json = kubeObject.jsonData || kubeObject._jsonData || kubeObject;
  const jsonMetadata = json?.metadata || {};
  const resolvedKind = kind || json.kind || kubeObject.kind;
  const apiVersion =
    json.apiVersion ||
    (resolvedKind === "ClusterInterceptor"
      ? "triggers.tekton.dev/v1alpha1"
      : resolvedKind === "EventListener" ||
          resolvedKind === "Trigger" ||
          resolvedKind === "TriggerBinding" ||
          resolvedKind === "TriggerTemplate" ||
          resolvedKind === "ClusterTriggerBinding"
        ? "triggers.tekton.dev/v1beta1"
        : "tekton.dev/v1");
  const normalizedMetadata = {
    ...jsonMetadata,
    ...meta(kubeObject),
    ...(ns ? { namespace: ns } : {}),
    labels: {
      ...(jsonMetadata.labels || {}),
      ...labels(kubeObject),
      ...(ns ? { [L.instance]: ns } : {}),
      [L.partOf]: "tekton",
      ...(component ? { [L.component]: component } : {}),
    },
  };

  kubeObject.jsonData = { ...json, apiVersion, kind: resolvedKind, metadata: normalizedMetadata };
  if ("_jsonData" in kubeObject) kubeObject._jsonData = kubeObject.jsonData;
  return kubeObject;
}

function syntheticData(
  data: any,
  namespace: string,
  name: string,
  kind: NodeKind,
) {
  return {
    ...data,
    kind,
    metadata: {
      ...(data?.metadata || {}),
      namespace,
      name,
      labels: {
        ...(data?.metadata?.labels || {}),
        [L.instance]: namespace,
        [L.partOf]: "tekton",
        [L.component]: kind.toLowerCase(),
      },
    },
  };
}

function addNode(nodes: Map<string, TektonNode>, node: TektonNode) {
  if (!node.id || nodes.has(node.id)) return;
  nodes.set(node.id, node);
}

function addKubeNode(
  nodes: Map<string, TektonNode>,
  nodeId: string,
  label: string,
  kind: NodeKind,
  obj: any,
  namespace?: string,
) {
  const normalized = normalizeForHeadlamp(obj, namespace, kind.toLowerCase(), kind);
  addNode(nodes, {
    id: nodeId,
    label,
    subtitle: kind,
    icon: tektonIcon,
    namespace,
    kubeObject: normalized,
    data: normalized,
    detailsComponent: NodeDetails,
  } as TektonNode);
}

function addSyntheticNode(
  nodes: Map<string, TektonNode>,
  nodeId: string,
  label: string,
  kind: "Task" | "Step" | "Trigger",
  namespace: string,
  data: any,
) {
  addNode(nodes, {
    id: nodeId,
    label,
    subtitle: kind,
    icon: tektonIcon,
    namespace,
    type: kind === "Task" ? "virtual-task" : kind.toLowerCase(),
    data: syntheticData(data, namespace, label, kind),
    detailsComponent: NodeDetails,
  } as TektonNode);
}

function addClusterNode(
  nodes: Map<string, TektonNode>,
  nodeId: string,
  label: string,
  kind: "ClusterInterceptor" | "ClusterTriggerBinding",
  data: any,
) {
  const normalized = normalizeForHeadlamp(data, undefined, kind.toLowerCase(), kind);
  const normalizedName = normalized?.metadata?.name || normalized?.jsonData?.metadata?.name || label;
  const normalizedData = {
    ...(normalized?.jsonData || normalized?._jsonData || normalized || {}),
    kind,
    metadata: {
      ...(normalized?.jsonData?.metadata || normalized?._jsonData?.metadata || normalized?.metadata || {}),
      name: normalizedName,
      labels: {
        ...(normalized?.jsonData?.metadata?.labels ||
          normalized?._jsonData?.metadata?.labels ||
          normalized?.metadata?.labels ||
          {}),
        [L.partOf]: "tekton",
        [L.component]: kind.toLowerCase(),
        [L.instance]: clusterOf(data),
      },
    },
  };

  if (normalized) {
    normalized.jsonData = normalizedData;
    if ("_jsonData" in normalized) normalized._jsonData = normalizedData;
    addNode(nodes, {
      id: nodeId,
      label,
      subtitle: kind,
      icon: tektonIcon,
      kubeObject: normalized,
      data: normalized,
      detailsComponent: NodeDetails,
    } as TektonNode);
    return;
  }

  addNode(nodes, {
    id: nodeId,
    label,
    subtitle: kind,
    icon: tektonIcon,
    type: kind.toLowerCase(),
    data: {
      ...(data?.jsonData || data?._jsonData || data || {}),
      kind,
      metadata: {
        ...(data?.metadata || data?.jsonData?.metadata || {}),
        name: label,
        labels: {
          ...(data?.metadata?.labels || data?.jsonData?.metadata?.labels || {}),
          [L.partOf]: "tekton",
          [L.component]: kind.toLowerCase(),
          [L.instance]: clusterOf(data),
        },
      },
    },
    detailsComponent: NodeDetails,
  } as TektonNode);
}

function addEdge(
  edges: Map<string, GraphEdge>,
  visualEdges: Set<string>,
  source?: string,
  target?: string,
  relation = "to",
) {
  if (!source || !target || source === target) return;

  const visualKey = `${source}->${target}`;
  if (visualEdges.has(visualKey)) return;
  visualEdges.add(visualKey);

  const edgeId = `edge-${source}-${relation}-${target}`;
  edges.set(edgeId, { id: edgeId, source, target });
}

const nodePriority: Record<NodeKind, number> = {
  EventListener: 10,
  Trigger: 20,
  ClusterInterceptor: 25,
  TriggerTemplate: 30,
  TriggerBinding: 35,
  ClusterTriggerBinding: 35,
  Pipeline: 40,
  Task: 50,
  Step: 55,
  TaskRun: 60,
  PipelineRun: 70,
};

function edgePriority(edge: GraphEdge) {
  const source = String(edge.source || "");
  const target = String(edge.target || "");
  if (source.startsWith("eventlistener-") && target.startsWith("trigger-"))
    return 10;
  if (source.startsWith("trigger-") && target.startsWith("clusterinterceptor-"))
    return 15;
  if (source.startsWith("trigger-") && target.startsWith("triggertemplate-"))
    return 20;
  if (source.startsWith("triggertemplate-") && target.startsWith("pipeline-"))
    return 30;
  if (source.startsWith("pipeline-") && /^(task|virtualtask)-/.test(target))
    return 40;
  if (/^(task|virtualtask)-/.test(source) && target.startsWith("taskrun-"))
    return 50;
  if (source.startsWith("taskrun-") && target.startsWith("pipelinerun-"))
    return 60;
  if (source.startsWith("task-") && target.startsWith("step-")) return 70;
  if (source.startsWith("trigger-")) return 80;
  return 100;
}

function sortedNodes(nodes: Iterable<TektonNode>) {
  return [...nodes].sort(
    (a, b) =>
      (nodePriority[a.subtitle as NodeKind] || 100) -
        (nodePriority[b.subtitle as NodeKind] || 100) ||
      (a.namespace || "").localeCompare(b.namespace || "") ||
      String(a.id).localeCompare(String(b.id)),
  );
}

function sortedValidEdges(nodes: TektonNode[], edges: Iterable<GraphEdge>) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return [...edges]
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .sort(
      (a, b) =>
        edgePriority(a) - edgePriority(b) ||
        String(a.id).localeCompare(String(b.id)),
    );
}

export function buildTektonGraph({
  pipelines = [],
  pipelineRuns = [],
  tasks = [],
  taskRuns = [],
  bindings = [],
  templates = [],
  listeners = [],
  interceptors = [],
  concolorProfiles = [],
  suppressConcolorPolicyRuntimeEdges = false,
  activeConcolorPolicyKinds,
  includeSteps = true,
}: Args) {
  const nodes = new Map<string, TektonNode>();
  const edges = new Map<string, GraphEdge>();
  const visualEdges = new Set<string>();
  const link = (source?: string, target?: string, relation?: string) =>
    addEdge(edges, visualEdges, source, target, relation);

  const pipelinesByNamespace = groupByNamespace(pipelines);
  const pipelinesByKey = indexByNamespaceName(pipelines);
  const pipelineByRunKey = new Map<string, string | undefined>();

  pipelineRuns.forEach((run) => {
    const cluster = clusterOf(run);
    const ns = nsOf(run);
    pipelineByRunKey.set(
      key(cluster, ns, nameOf(run)),
      pipelineNameForRun(run, pipelinesByNamespace.get(`${cluster}/${ns}`) || []),
    );
  });

  pipelines.forEach((pipeline) => {
    const cluster = clusterOf(pipeline);
    const ns = nsOf(pipeline);
    const pipelineName = nameOf(pipeline);
    const pipelineId = ID.pipeline(cluster, ns, pipelineName);
    addKubeNode(nodes, pipelineId, pipelineName, "Pipeline", pipeline, ns);

    pipelineEntries(pipeline).forEach((entry) => {
      const taskName = entryName(entry);
      const target = targetForPipelineEntry(cluster, ns, pipelineName, entry);

      if (isResolverEntry(entry)) {
        const virtualId = ID.virtualTask(cluster, ns, pipelineName, taskName);
        addSyntheticNode(nodes, virtualId, taskName, "Task", ns, {
          ...entry,
          metadata: {
            namespace: ns,
            name: taskName,
            labels: { [L.pipeline]: pipelineName, [L.pipelineTask]: taskName },
          },
          virtual: true,
          virtualReason: `taskRef.resolver=${taskRef(entry).resolver}`,
        });
      }

      link(pipelineId, target, taskName);
    });
  });

  tasks.forEach((task) => {
    const cluster = clusterOf(task);
    const ns = nsOf(task);
    const taskName = nameOf(task);
    const taskId = ID.task(cluster, ns, taskName);
    addKubeNode(nodes, taskId, taskName, "Task", task, ns);

    if (!includeSteps) return;

    (task.spec?.steps || []).forEach((step: any, index: number) => {
      const stepName = step?.name || `step-${index}`;
      const stepId = ID.step(cluster, ns, taskName, stepName, index);
      addSyntheticNode(nodes, stepId, stepName, "Step", ns, step);
      link(taskId, stepId, "step");
    });
  });

  pipelineRuns.forEach((run) => {
    const cluster = clusterOf(run);
    const ns = nsOf(run);
    const runName = nameOf(run);
    addKubeNode(
      nodes,
      ID.pipelineRun(cluster, ns, runName),
      runName,
      "PipelineRun",
      run,
      ns,
    );
  });

  taskRuns.forEach((run) => {
    const cluster = clusterOf(run);
    const ns = nsOf(run);
    const runName = nameOf(run);
    const taskRunId = ID.taskRun(cluster, ns, runName);
    addKubeNode(nodes, taskRunId, runName, "TaskRun", run, ns);

    const pipelineRunName = pipelineRunNameForTaskRun(run);
    const pipelineRunId = pipelineRunName
      ? ID.pipelineRun(cluster, ns, pipelineRunName)
      : undefined;
    const pipelineRun = pipelineRunName
      ? pipelineRuns.find(
          (item) =>
            clusterOf(item) === cluster &&
            nsOf(item) === ns &&
            nameOf(item) === pipelineRunName,
        )
      : undefined;
    const pipelineName =
      pipelineNameForTaskRunLabel(run) ||
      (pipelineRunName
        ? pipelineByRunKey.get(key(cluster, ns, pipelineRunName))
        : undefined);

    link(
      targetForTaskRun(run, pipelineName, pipelinesByKey),
      taskRunId,
      "taskRun",
    );
    const suppressDirectPipelineRunEdge =
      suppressConcolorPolicyRuntimeEdges &&
      hasPolicyMediatedPipelineRunEdge(
        run,
        pipelineRun,
        concolorProfiles,
        activeConcolorPolicyKinds,
      );

    if (
      !suppressConcolorPolicyRuntimeEdges ||
      !suppressDirectPipelineRunEdge
    ) {
      link(taskRunId, pipelineRunId, "pipelineRun");
    }
  });

  templates.forEach((template) => {
    const cluster = clusterOf(template);
    const ns = nsOf(template);
    const templateName = nameOf(template);
    const templateId = ID.triggerTemplate(cluster, ns, templateName);
    addKubeNode(
      nodes,
      templateId,
      templateName,
      "TriggerTemplate",
      template,
      ns,
    );

    triggerTemplatePipelineRefs(template).forEach((pipelineName) =>
      link(templateId, ID.pipeline(cluster, ns, pipelineName), "pipelineTemplate"),
    );
  });

  bindings.forEach((binding) => {
    const ns = meta(binding).namespace;
    const bindingName = nameOf(binding);
    const bindingCluster = clusterOf(binding);
    if (ns)
      addKubeNode(
        nodes,
        ID.triggerBinding(bindingCluster, ns, bindingName),
        bindingName,
        "TriggerBinding",
        binding,
        ns,
      );
    else
      addClusterNode(
        nodes,
        ID.clusterTriggerBinding(bindingCluster, bindingName),
        bindingName,
        "ClusterTriggerBinding",
        binding,
      );
  });

  interceptors.forEach((interceptor) => {
    const interceptorCluster = clusterOf(interceptor);
    addClusterNode(
      nodes,
      ID.clusterInterceptor(interceptorCluster, nameOf(interceptor)),
      nameOf(interceptor),
      "ClusterInterceptor",
      interceptor,
    );
  });

  listeners.forEach((listener) => {
    const ns = nsOf(listener);
    const listenerCluster = clusterOf(listener);
    const listenerName = nameOf(listener);
    const listenerId = ID.eventListener(listenerCluster, ns, listenerName);
    addKubeNode(nodes, listenerId, listenerName, "EventListener", listener, ns);

    (listener.spec?.triggers || []).forEach((trigger: any, index: number) => {
      const triggerName = trigger?.name || `trigger-${index}`;
      const triggerId = ID.trigger(listenerCluster, ns, listenerName, triggerName, index);
      addSyntheticNode(nodes, triggerId, triggerName, "Trigger", ns, trigger);
      link(listenerId, triggerId, "trigger");

      (trigger.bindings || []).forEach((binding: any, bindingIndex: number) => {
        const ref = binding?.ref || binding?.name;
        if (!ref) return;
        const isCluster =
          (binding?.kind || binding?.refKind) === "ClusterTriggerBinding";
        link(
          triggerId,
          isCluster
            ? ID.clusterTriggerBinding(listenerCluster, ref)
            : ID.triggerBinding(listenerCluster, ns, ref),
          `binding-${bindingIndex}`,
        );
      });

      const templateRef = triggerTemplateRef(trigger, ns);
      link(
        triggerId,
        templateRef.name ? ID.triggerTemplate(listenerCluster, templateRef.namespace, templateRef.name) : undefined,
        "template",
      );

      (trigger.interceptors || []).forEach(
        (interceptor: any, interceptorIndex: number) => {
          const interceptorName = interceptor?.ref?.name;
          if (interceptorName) {
            link(
              triggerId,
              ID.clusterInterceptor(listenerCluster, interceptorName),
              `interceptor-${interceptorIndex}`,
            );
          }
        },
      );
    });
  });

  const graphNodes = sortedNodes(nodes.values());
  return {
    graphNodes: graphNodes as GraphNode[],
    edges: sortedValidEdges(graphNodes, edges.values()),
  };
}
