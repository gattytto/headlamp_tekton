// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/map/tektonSource.tsx

// Resource-map source definition for Tekton resources.
// No namespace selected: return the complete Tekton map, including cluster-scoped resources.
// One or more namespaces selected: return only resources scoped to those namespaces;
// cluster-scoped Tekton resources and their edges are intentionally excluded.

import React from "react";
import { Icon } from "@iconify/react";
import { ResourceSource } from "@kinvolk/headlamp-plugin/lib/components/resourceMap";
import { useMemo } from "react";
import { buildTektonGraph } from "./tektonGraphBuilder";
import { NodeDetails } from "../components/NodeDetails";

import { PipelineClass } from "../crd/pipeline";
import { PipelineRunClass } from "../crd/pipelinerun";
import { TaskClass } from "../crd/task";
import { TaskRunClass } from "../crd/taskrun";
import { TriggerBindingClass } from "../crd/trigger";
import { TriggerTemplateClass } from "../crd/triggertemplate";
import { EventListenerClass } from "../crd/eventlistener";
import { ClusterInterceptorClass } from "../crd/clusterinterceptor";

function objectNamespace(obj: any): string | undefined {
  return obj?.metadata?.namespace;
}

function listNamespaces(items: any[]): string[] {
  return Array.from(
    new Set(items.map((item) => item?.metadata?.namespace || "(cluster)")),
  ).sort();
}

function selectedNamespacesFromLocation(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const url = new URL(window.location.href);
    const values = url.searchParams
      .getAll("namespace")
      .flatMap((value) => value.split(/[,\s]+/))
      .map((value) => value.trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort();
  } catch {
    return [];
  }
}

function filterBySelectedNamespaces<T extends any>(
  items: T[],
  selectedNamespaces: string[],
): T[] {
  if (selectedNamespaces.length === 0) return items;
  const selected = new Set(selectedNamespaces);
  return items.filter((item) => selected.has(objectNamespace(item) || ""));
}

function onlyWhenNoNamespaceSelected<T extends any>(
  items: T[],
  selectedNamespaces: string[],
): T[] {
  return selectedNamespaces.length === 0 ? items : [];
}

export const tektonSource: ResourceSource = {
  id: "tekton",
  label: "Tekton",
  icon: <Icon icon="custom:tekton" />,
  detailsComponent: NodeDetails,

  useData() {
    const locationHref = typeof window !== "undefined" ? window.location.href : "";
    const selectedNamespaces = selectedNamespacesFromLocation();

    const [pipelines] = PipelineClass.useList();
    const [pipelineRuns] = PipelineRunClass.useList();
    const [tasks] = TaskClass.useList();
    const [taskRuns] = TaskRunClass.useList();
    const [bindings] = TriggerBindingClass.useList();
    const [templates] = TriggerTemplateClass.useList();
    const [listeners] = EventListenerClass.useList();
    const [interceptors] = ClusterInterceptorClass.useList();

    return useMemo(() => {
      const allReady =
        pipelines !== null &&
        pipelineRuns !== null &&
        tasks !== null &&
        taskRuns !== null &&
        bindings !== null &&
        templates !== null &&
        listeners !== null &&
        interceptors !== null;

      if (!allReady) return { nodes: [], edges: [] };

      const raw = {
        pipelines: pipelines ?? [],
        pipelineRuns: pipelineRuns ?? [],
        tasks: tasks ?? [],
        taskRuns: taskRuns ?? [],
        bindings: bindings ?? [],
        templates: templates ?? [],
        listeners: listeners ?? [],
        interceptors: interceptors ?? [],
      };

      const input = {
        pipelines: filterBySelectedNamespaces(raw.pipelines, selectedNamespaces),
        pipelineRuns: filterBySelectedNamespaces(raw.pipelineRuns, selectedNamespaces),
        tasks: filterBySelectedNamespaces(raw.tasks, selectedNamespaces),
        taskRuns: filterBySelectedNamespaces(raw.taskRuns, selectedNamespaces),
        bindings: filterBySelectedNamespaces(raw.bindings, selectedNamespaces),
        templates: filterBySelectedNamespaces(raw.templates, selectedNamespaces),
        listeners: filterBySelectedNamespaces(raw.listeners, selectedNamespaces),
        // Headlamp re-groups selected-namespace maps after the source returns data.
        // Cluster-scoped nodes disturb that layout, so they are shown only in the full/global map.
        interceptors: onlyWhenNoNamespaceSelected(raw.interceptors, selectedNamespaces),
        selectedNamespaces,
        selectedNamespace: selectedNamespaces[0],
      };

      const { graphNodes, edges } = buildTektonGraph(input);

      return {
        nodes: graphNodes as any,
        edges,
      };
    }, [
      pipelines,
      pipelineRuns,
      tasks,
      taskRuns,
      bindings,
      templates,
      listeners,
      interceptors,
      locationHref,
    ]);
  },
};
