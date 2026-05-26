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

import {
  GraphEdge,
  GraphNode,
} from "@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel";
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

const meta = (o: any) => o?.metadata || {};
const labels = (o: any): Record<string, string> => meta(o).labels || {};
const annotations = (o: any): Record<string, string> =>
  meta(o).annotations || {};
const nameOf = (o: any) => meta(o).name || "";
const nsOf = (o: any) => meta(o).namespace || "default";
const key = (ns: string, name: string) => `${ns}/${name}`;
const first = (...values: Array<string | undefined>) => values.find(Boolean);
const owner = (o: any, kind: string) =>
  (meta(o).ownerReferences || []).find((ref: any) => ref?.kind === kind)?.name;

const id = (kind: string, ...parts: Array<string | number | undefined>) =>
  [kind, ...parts.filter((v) => v !== undefined && v !== "")].join("-");

// Stable Resource Map node ID builders.
// IDs include kind + namespace + name so edges stay valid across refreshes;
// cluster-scoped resources intentionally omit namespace.
const ID = {
  pipeline: (ns: string, name: string) => id("pipeline", ns, name),
  pipelineRun: (ns: string, name: string) => id("pipelinerun", ns, name),
  task: (ns: string, name: string) => id("task", ns, name),
  taskRun: (ns: string, name: string) => id("taskrun", ns, name),
  virtualTask: (ns: string, pipeline: string, task: string) =>
    id("virtualtask", ns, pipeline, task),
  eventListener: (ns: string, name: string) => id("eventlistener", ns, name),
  trigger: (ns: string, listener: string, trigger: string, index: number) =>
    id("trigger", ns, listener, trigger, index),
  triggerTemplate: (ns: string, name: string) =>
    id("triggertemplate", ns, name),
  triggerBinding: (ns: string, name: string) => id("triggerbinding", ns, name),
  clusterTriggerBinding: (name: string) => id("clustertriggerbinding", name),
  clusterInterceptor: (name: string) => id("clusterinterceptor", name),
  step: (ns: string, task: string, step: string, index: number) =>
    id("step", ns, task, step, index),
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

function hasPolicyMediatedPipelineRunEdge(taskRun: any, pipelineRun: any, profiles: any[]) {
  if (!pipelineRun) return false;

  const taskRunLabels = labels(taskRun);
  const pipelineRunLabels = labels(pipelineRun);
  const selectors = profiles
    .filter((profile) => profile?.status?.generatedCalicoPolicy)
    .map((profile) => profile?.status?.selectorLabel)
    .filter((selector) => selector?.key && selector?.value);

  if (selectors.length > 0) {
    return selectors.some(
      (selector) =>
        taskRunLabels[selector.key] === selector.value &&
        pipelineRunLabels[selector.key] === selector.value,
    );
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
  namespace: string,
  pipelineName: string,
  entry: any,
) {
  if (isResolverEntry(entry))
    return ID.virtualTask(namespace, pipelineName, entryName(entry));
  if (isConcreteTaskEntry(entry))
    return ID.task(namespace, taskRef(entry).name);
  return undefined;
}

function targetForTaskRun(
  taskRun: any,
  pipelineName: string | undefined,
  pipelinesByKey: Map<string, any>,
) {
  const namespace = nsOf(taskRun);
  const pipeline = pipelineName
    ? pipelinesByKey.get(key(namespace, pipelineName))
    : undefined;
  const pipelineRunName = pipelineRunNameForTaskRun(taskRun);
  const entry = pipelineEntries(pipeline).find((e) =>
    matchesPipelineEntry(e, taskRun, pipelineRunName),
  );
  const pipelineTarget =
    pipelineName && entry
      ? targetForPipelineEntry(namespace, pipelineName, entry)
      : undefined;

  if (pipelineTarget) return pipelineTarget;

  // Fallbacks keep standalone TaskRuns and older Tekton labels useful.
  const explicitTask = taskNameForTaskRun(taskRun);
  if (explicitTask) return ID.task(namespace, explicitTask);
  if (pipelineName && taskRun?.spec?.taskRef?.resolver) {
    return ID.virtualTask(
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

function groupByNamespace(items: any[]) {
  const grouped = new Map<string, any[]>();
  items.forEach((item) => {
    const ns = nsOf(item);
    if (!grouped.has(ns)) grouped.set(ns, []);
    grouped.get(ns)!.push(item);
  });
  return grouped;
}

function indexByNamespaceName(items: any[]) {
  const indexed = new Map<string, any>();
  items.forEach((item) => indexed.set(key(nsOf(item), nameOf(item)), item));
  return indexed;
}

function cloneForHeadlamp(
  kubeObject: any,
  namespace?: string,
  component?: string,
) {
  if (!kubeObject) return kubeObject;

  const ns = namespace || meta(kubeObject).namespace;
  const json = kubeObject.jsonData || kubeObject._jsonData || kubeObject;
  const normalizedMetadata = {
    ...meta(kubeObject),
    ...(ns ? { namespace: ns } : {}),
    labels: {
      ...labels(kubeObject),
      ...(ns ? { [L.instance]: ns } : {}),
      [L.partOf]: "tekton",
      ...(component ? { [L.component]: component } : {}),
    },
  };

  // Keep the KubeObject prototype; Headlamp calls KubeObject methods while rendering nodes.
  // Do not write to .metadata because Headlamp exposes it as a getter-only property.
  const clone = Object.assign(
    Object.create(Object.getPrototypeOf(kubeObject)),
    kubeObject,
  );
  clone.jsonData = { ...json, metadata: normalizedMetadata };
  if ("_jsonData" in clone) clone._jsonData = clone.jsonData;
  return clone;
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
  const normalized = cloneForHeadlamp(obj, namespace, kind.toLowerCase());
  addNode(nodes, {
    id: nodeId,
    label,
    subtitle: kind,
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
  // Cluster-scoped nodes stay synthetic so tektonSource can decide when to include them.
  addNode(nodes, {
    id: nodeId,
    label,
    subtitle: kind,
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
  TriggerTemplate: 30,
  TriggerBinding: 35,
  ClusterTriggerBinding: 35,
  ClusterInterceptor: 35,
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
    const ns = nsOf(run);
    pipelineByRunKey.set(
      key(ns, nameOf(run)),
      pipelineNameForRun(run, pipelinesByNamespace.get(ns) || []),
    );
  });

  pipelines.forEach((pipeline) => {
    const ns = nsOf(pipeline);
    const pipelineName = nameOf(pipeline);
    const pipelineId = ID.pipeline(ns, pipelineName);
    addKubeNode(nodes, pipelineId, pipelineName, "Pipeline", pipeline, ns);

    pipelineEntries(pipeline).forEach((entry) => {
      const taskName = entryName(entry);
      const target = targetForPipelineEntry(ns, pipelineName, entry);

      if (isResolverEntry(entry)) {
        const virtualId = ID.virtualTask(ns, pipelineName, taskName);
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
    const ns = nsOf(task);
    const taskName = nameOf(task);
    const taskId = ID.task(ns, taskName);
    addKubeNode(nodes, taskId, taskName, "Task", task, ns);

    (task.spec?.steps || []).forEach((step: any, index: number) => {
      const stepName = step?.name || `step-${index}`;
      const stepId = ID.step(ns, taskName, stepName, index);
      addSyntheticNode(nodes, stepId, stepName, "Step", ns, step);
      link(taskId, stepId, "step");
    });
  });

  pipelineRuns.forEach((run) => {
    const ns = nsOf(run);
    const runName = nameOf(run);
    addKubeNode(
      nodes,
      ID.pipelineRun(ns, runName),
      runName,
      "PipelineRun",
      run,
      ns,
    );
  });

  taskRuns.forEach((run) => {
    const ns = nsOf(run);
    const runName = nameOf(run);
    const taskRunId = ID.taskRun(ns, runName);
    addKubeNode(nodes, taskRunId, runName, "TaskRun", run, ns);

    const pipelineRunName = pipelineRunNameForTaskRun(run);
    const pipelineRunId = pipelineRunName
      ? ID.pipelineRun(ns, pipelineRunName)
      : undefined;
    const pipelineName =
      pipelineNameForTaskRunLabel(run) ||
      (pipelineRunName
        ? pipelineByRunKey.get(key(ns, pipelineRunName))
        : undefined);

    link(
      targetForTaskRun(run, pipelineName, pipelinesByKey),
      taskRunId,
      "taskRun",
    );
    if (
      !suppressConcolorPolicyRuntimeEdges ||
      !hasPolicyMediatedPipelineRunEdge(run, pipelineRun, concolorProfiles)
    ) {
      link(taskRunId, pipelineRunId, "pipelineRun");
    }
  });

  templates.forEach((template) => {
    const ns = nsOf(template);
    const templateName = nameOf(template);
    const templateId = ID.triggerTemplate(ns, templateName);
    addKubeNode(
      nodes,
      templateId,
      templateName,
      "TriggerTemplate",
      template,
      ns,
    );

    triggerTemplatePipelineRefs(template).forEach((pipelineName) =>
      link(templateId, ID.pipeline(ns, pipelineName), "pipelineTemplate"),
    );
  });

  bindings.forEach((binding) => {
    const ns = meta(binding).namespace;
    const bindingName = nameOf(binding);
    if (ns)
      addKubeNode(
        nodes,
        ID.triggerBinding(ns, bindingName),
        bindingName,
        "TriggerBinding",
        binding,
        ns,
      );
    else
      addClusterNode(
        nodes,
        ID.clusterTriggerBinding(bindingName),
        bindingName,
        "ClusterTriggerBinding",
        binding,
      );
  });

  interceptors.forEach((interceptor) => {
    addClusterNode(
      nodes,
      ID.clusterInterceptor(nameOf(interceptor)),
      nameOf(interceptor),
      "ClusterInterceptor",
      interceptor,
    );
  });

  listeners.forEach((listener) => {
    const ns = nsOf(listener);
    const listenerName = nameOf(listener);
    const listenerId = ID.eventListener(ns, listenerName);
    addKubeNode(nodes, listenerId, listenerName, "EventListener", listener, ns);

    (listener.spec?.triggers || []).forEach((trigger: any, index: number) => {
      const triggerName = trigger?.name || `trigger-${index}`;
      const triggerId = ID.trigger(ns, listenerName, triggerName, index);
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
            ? ID.clusterTriggerBinding(ref)
            : ID.triggerBinding(ns, ref),
          `binding-${bindingIndex}`,
        );
      });

      const templateRef = trigger.template?.ref || trigger.template?.name;
      link(
        triggerId,
        templateRef ? ID.triggerTemplate(ns, templateRef) : undefined,
        "template",
      );

      (trigger.interceptors || []).forEach(
        (interceptor: any, interceptorIndex: number) => {
          const interceptorName = interceptor?.ref?.name;
          if (interceptorName) {
            link(
              triggerId,
              ID.clusterInterceptor(interceptorName),
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
