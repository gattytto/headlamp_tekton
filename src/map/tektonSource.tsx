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
  return obj?.metadata?.namespace || obj?.jsonData?.metadata?.namespace || obj?._jsonData?.metadata?.namespace;
}

function objectName(obj: any): string | undefined {
  return obj?.metadata?.name || obj?.jsonData?.metadata?.name || obj?._jsonData?.metadata?.name;
}

function objectCluster(obj: any): string {
  return obj?.cluster || obj?._clusterName || 'cluster';
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

function key(cluster?: string, namespace?: string, name?: string) {
  return cluster && namespace && name ? `${cluster}/${namespace}/${name}` : "";
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
      const refKey = key(objectCluster(listener), ref.namespace, ref.name);
      if (refKey) refs.add(refKey);
    });
  });
  return refs;
}

function includeReferencedListeners(listeners: any[], selectedListeners: any[], templates: any[]) {
  const templateKeys = new Set(
    templates
      .map(template => key(objectCluster(template), objectNamespace(template), objectName(template)))
      .filter(Boolean),
  );
  if (!templateKeys.size) return selectedListeners;

  const selectedByKey = new Map(selectedListeners.map(listener => [
    key(objectCluster(listener), objectNamespace(listener), objectName(listener)),
    listener,
  ]));

  listeners.forEach(listener => {
    const listenerNamespace = objectNamespace(listener);
    const referencesSelectedTemplate = (listener?.spec?.triggers || []).some((trigger: any) => {
      const ref = triggerTemplateRef(trigger, listenerNamespace);
      return templateKeys.has(key(objectCluster(listener), ref.namespace, ref.name));
    });
    const listenerKey = key(objectCluster(listener), listenerNamespace, objectName(listener));
    if (referencesSelectedTemplate && listenerKey && !selectedByKey.has(listenerKey)) {
      selectedByKey.set(listenerKey, listener);
    }
  });

  return Array.from(selectedByKey.values());
}

function includeReferencedTemplates(templates: any[], selectedTemplates: any[], listeners: any[]) {
  const referenced = referencedTriggerTemplates(listeners);
  if (!referenced.size) return selectedTemplates;

  const selectedByKey = new Map(selectedTemplates.map(template => [
    key(objectCluster(template), objectNamespace(template), objectName(template)),
    template,
  ]));

  templates.forEach(template => {
    const templateKey = key(objectCluster(template), objectNamespace(template), objectName(template));
    if (referenced.has(templateKey) && !selectedByKey.has(templateKey)) {
      selectedByKey.set(templateKey, template);
    }
  });

  return Array.from(selectedByKey.values());
}

function referencedClusterInterceptors(listeners: any[]) {
  const refs = new Set<string>();
  listeners.forEach(listener => {
    (listener?.spec?.triggers || []).forEach((trigger: any) => {
      (trigger?.interceptors || []).forEach((interceptor: any) => {
        if (interceptor?.ref?.kind === 'ClusterInterceptor' && interceptor?.ref?.name) {
          refs.add(`${objectCluster(listener)}/${interceptor.ref.name}`);
        }
      });
    });
  });
  return refs;
}

function includeReferencedClusterInterceptors(interceptors: any[], listeners: any[]) {
  const referenced = referencedClusterInterceptors(listeners);
  if (!referenced.size) return [];
  return interceptors.filter(interceptor =>
    referenced.has(`${objectCluster(interceptor)}/${objectName(interceptor) || ''}`)
  );
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

      const selectedTemplates = filterBySelectedNamespaces(raw.templates, selectedNamespaces);
      const selectedListeners = includeReferencedListeners(
        raw.listeners,
        filterBySelectedNamespaces(raw.listeners, selectedNamespaces),
        selectedTemplates,
      );
      const referencedInterceptors = includeReferencedClusterInterceptors(raw.interceptors, selectedListeners);
      const selectedInterceptors =
        referencedInterceptors.length > 0
          ? referencedInterceptors
          : selectedNamespaces.length === 0
            ? raw.interceptors
            : [];

      const input = {
        pipelines: filterBySelectedNamespaces(raw.pipelines, selectedNamespaces),
        pipelineRuns: filterBySelectedNamespaces(raw.pipelineRuns, selectedNamespaces),
        tasks: filterBySelectedNamespaces(raw.tasks, selectedNamespaces),
        taskRuns: filterBySelectedNamespaces(raw.taskRuns, selectedNamespaces),
        bindings: filterBySelectedNamespaces(raw.bindings, selectedNamespaces),
        templates: includeReferencedTemplates(raw.templates, selectedTemplates, selectedListeners),
        listeners: selectedListeners,
        interceptors: selectedInterceptors,
        concolorProfiles: filterBySelectedNamespaces(raw.concolorProfiles, selectedNamespaces),
        selectedNamespaces,
        selectedNamespace: selectedNamespaces[0],
        includeSteps: true,
        suppressConcolorPolicyRuntimeEdges:
          interop.suppressConcolorPolicyRuntimeEdges,
      };

      let { graphNodes, edges } = buildTektonGraph(input);
      if (selectedNamespaces.length === 0 && graphNodes.length > 50) {
        ({ graphNodes, edges } = buildTektonGraph({
          ...input,
          includeSteps: false,
        }));
      }

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
