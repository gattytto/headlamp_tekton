// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/map/tektonSource.tsx

// Resource-map source definition for Tekton resources.
// No namespace selected: return the complete Tekton map, including cluster-scoped resources.
// One or more namespaces selected: return only resources scoped to those namespaces;
// cluster-scoped Tekton resources and their edges are intentionally excluded.

import React from "react";
import { Icon } from "@iconify/react";
import { ResourceSource } from "@kinvolk/headlamp-plugin/lib/components/resourceMap";
import { useEffect, useMemo, useState } from "react";
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
import { ConcolorPolicyProfileClass } from "../crd/concolor";

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

function key(namespace?: string, name?: string) {
  return namespace && name ? `${namespace}/${name}` : "";
}

function triggerTemplateRef(trigger: any, defaultNamespace?: string) {
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

function referencedTriggerTemplates(listeners: any[]) {
  const refs = new Set<string>();
  listeners.forEach(listener => {
    const listenerNamespace = objectNamespace(listener);
    (listener?.spec?.triggers || []).forEach((trigger: any) => {
      const ref = triggerTemplateRef(trigger, listenerNamespace);
      const refKey = key(ref.namespace, ref.name);
      if (refKey) refs.add(refKey);
    });
  });
  return refs;
}

function includeReferencedTemplates(templates: any[], selectedTemplates: any[], listeners: any[]) {
  const referenced = referencedTriggerTemplates(listeners);
  if (!referenced.size) return selectedTemplates;

  const selectedByKey = new Map(selectedTemplates.map(template => [
    key(objectNamespace(template), template?.metadata?.name),
    template,
  ]));

  templates.forEach(template => {
    const templateKey = key(objectNamespace(template), template?.metadata?.name);
    if (referenced.has(templateKey) && !selectedByKey.has(templateKey)) {
      selectedByKey.set(templateKey, template);
    }
  });

  return Array.from(selectedByKey.values());
}

function onlyWhenNoNamespaceSelected<T extends any>(
  items: T[],
  selectedNamespaces: string[],
): T[] {
  return selectedNamespaces.length === 0 ? items : [];
}

function useGraphInterop() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const win = window as any;
    win.__headlampGraphInterop = win.__headlampGraphInterop || {};
    win.__headlampGraphInterop.counts = win.__headlampGraphInterop.counts || {};
    win.__headlampGraphInterop.counts.tekton =
      (win.__headlampGraphInterop.counts.tekton || 0) + 1;
    win.__headlampGraphInterop.tekton =
      win.__headlampGraphInterop.counts.tekton > 0;
    window.dispatchEvent(new CustomEvent("headlamp-graph-interop-change"));

    const onChange = () => setVersion((value) => value + 1);
    window.addEventListener("headlamp-graph-interop-change", onChange);

    return () => {
      win.__headlampGraphInterop.counts.tekton = Math.max(
        0,
        (win.__headlampGraphInterop.counts.tekton || 0) - 1,
      );
      win.__headlampGraphInterop.tekton =
        win.__headlampGraphInterop.counts.tekton > 0;
      window.removeEventListener("headlamp-graph-interop-change", onChange);
      window.dispatchEvent(new CustomEvent("headlamp-graph-interop-change"));
    };
  }, []);

  const interop =
    typeof window !== "undefined"
      ? ((window as any).__headlampGraphInterop || {})
      : {};
  const interopSnapshot = {
    ...interop,
    counts: { ...(interop.counts || {}) },
  };

  return {
    version,
    suppressConcolorPolicyRuntimeEdges: Boolean(
      interop.calico || interop.concolor,
    ),
    interop: interopSnapshot,
  };
}

export const tektonSource: ResourceSource = {
  id: "tekton",
  label: "Tekton",
  icon: <Icon icon="custom:tekton" />,
  detailsComponent: NodeDetails,

  useData() {
    const locationHref = typeof window !== "undefined" ? window.location.href : "";
    const selectedNamespaces = selectedNamespacesFromLocation();
    const interop = useGraphInterop();

    const [pipelines] = PipelineClass.useList();
    const [pipelineRuns] = PipelineRunClass.useList();
    const [tasks] = TaskClass.useList();
    const [taskRuns] = TaskRunClass.useList();
    const [bindings] = TriggerBindingClass.useList();
    const [templates] = TriggerTemplateClass.useList();
    const [listeners] = EventListenerClass.useList();
    const [interceptors] = ClusterInterceptorClass.useList();
    const [concolorProfiles] = ConcolorPolicyProfileClass.useList();

    return useMemo(() => {
      const allReady =
        pipelines !== null &&
        pipelineRuns !== null &&
        tasks !== null &&
        taskRuns !== null &&
        bindings !== null &&
        templates !== null &&
        listeners !== null &&
        interceptors !== null &&
        concolorProfiles !== null;

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
        concolorProfiles: concolorProfiles ?? [],
      };

      const selectedListeners = filterBySelectedNamespaces(raw.listeners, selectedNamespaces);
      const selectedTemplates = filterBySelectedNamespaces(raw.templates, selectedNamespaces);

      const input = {
        pipelines: filterBySelectedNamespaces(raw.pipelines, selectedNamespaces),
        pipelineRuns: filterBySelectedNamespaces(raw.pipelineRuns, selectedNamespaces),
        tasks: filterBySelectedNamespaces(raw.tasks, selectedNamespaces),
        taskRuns: filterBySelectedNamespaces(raw.taskRuns, selectedNamespaces),
        bindings: filterBySelectedNamespaces(raw.bindings, selectedNamespaces),
        templates: includeReferencedTemplates(raw.templates, selectedTemplates, selectedListeners),
        listeners: selectedListeners,
        // Headlamp re-groups selected-namespace maps after the source returns data.
        // Cluster-scoped nodes disturb that layout, so they are shown only in the full/global map.
        interceptors: onlyWhenNoNamespaceSelected(raw.interceptors, selectedNamespaces),
        concolorProfiles: filterBySelectedNamespaces(raw.concolorProfiles, selectedNamespaces),
        selectedNamespaces,
        selectedNamespace: selectedNamespaces[0],
        suppressConcolorPolicyRuntimeEdges:
          interop.suppressConcolorPolicyRuntimeEdges,
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
      concolorProfiles,
      locationHref,
      interop.version,
    ]);
  },
};
