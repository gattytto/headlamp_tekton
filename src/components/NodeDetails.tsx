// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/components/NodeDetails.tsx
import { DetailsGrid, NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Fragment } from 'react';
import { ClusterInterceptorClass } from '../crd/clusterinterceptor';
import { EventListenerClass } from '../crd/eventlistener';
import { PipelineClass } from '../crd/pipeline';
import { PipelineRunClass } from '../crd/pipelinerun';
import { TaskClass } from '../crd/task';
import { TaskRunClass } from '../crd/taskrun';
import { TriggerBindingClass } from '../crd/trigger';
import { TriggerTemplateClass } from '../crd/triggertemplate';
import { extraSectionsFor, mainInfoRows } from '../pages/detailHelpers';
import { RawJsonViewer } from '../pages/RawJSONViewer';

type Props = {
  node?: {
    id?: string;
    label?: string;
    type?: string;
    data?: any;
    kubeObject?: any;
  };
};

function syntheticRows(node: Props['node']) {
  if (!node) return [];

  if (node.type === 'step') {
    return [
      { name: 'Step Name', value: node.data?.name ?? node.label ?? '-' },
      { name: 'Image', value: node.data?.image ?? '-' },
      { name: 'Command', value: node.data?.command?.join(' ') ?? '-' },
      { name: 'Args', value: node.data?.args?.join(' ') ?? '-' },
    ];
  }

  if (node.type === 'trigger') {
    return [
      { name: 'Trigger Name', value: node.data?.name ?? node.label ?? '-' },
      { name: 'Bindings', value: node.data?.bindings?.length ?? 0 },
      { name: 'Template', value: node.data?.template?.name || node.data?.template || '-' },
    ];
  }

  return [];
}

function resourceTypeFor(kind?: string) {
  switch (kind) {
    case 'Pipeline':
      return PipelineClass;
    case 'PipelineRun':
      return PipelineRunClass;
    case 'Task':
      return TaskClass;
    case 'TaskRun':
      return TaskRunClass;
    case 'TriggerBinding':
      return TriggerBindingClass;
    case 'TriggerTemplate':
      return TriggerTemplateClass;
    case 'EventListener':
      return EventListenerClass;
    case 'ClusterInterceptor':
      return ClusterInterceptorClass;
    default:
      return null;
  }
}

function clusterOf(obj: any) {
  return obj?.cluster || obj?._clusterName;
}

function kindOf(obj: any, node?: Props['node']) {
  return obj?.kind || obj?.jsonData?.kind || node?.subtitle || node?.data?.kind;
}

function metadataOf(obj: any) {
  return obj?.metadata || obj?.jsonData?.metadata || obj?._jsonData?.metadata || {};
}

export function NodeDetails({ node }: Props) {
  if (!node) return <SectionBox title="Details">No node selected</SectionBox>;

  if (!node.kubeObject) {
    const rows = syntheticRows(node);

    return (
      <>
        <SectionBox title={node.label || node.id || 'Synthetic Node'}>
          <NameValueTable rows={[{ name: 'Type', value: node.type ?? 'synthetic' }, ...rows]} />
        </SectionBox>
        {node.data && (
          <SectionBox title="Raw Data">
            <RawJsonViewer data={node.data} />
          </SectionBox>
        )}
      </>
    );
  }

  const obj = node.kubeObject;
  const resourceKind = kindOf(obj, node);
  const resourceType = resourceTypeFor(resourceKind);
  const resourceMetadata = metadataOf(obj);

  if (resourceType && resourceMetadata.name) {
    return (
      <DetailsGrid
        resourceType={resourceType as any}
        name={resourceMetadata.name}
        namespace={resourceMetadata.namespace}
        cluster={clusterOf(obj)}
        withEvents
        extraInfo={item => item && mainInfoRows(item)}
        extraSections={item => (item ? extraSectionsFor(item) : [])}
      />
    );
  }

  return (
    <>
      <SectionBox title={node.label || node.id || 'Details'}>
        <NameValueTable rows={[{ name: 'Kind', value: resourceKind || '-' }, ...mainInfoRows(obj)]} />
      </SectionBox>
      {extraSectionsFor(obj).map((section: any, index: number) => (
        <Fragment key={section?.id || index}>{section?.section || section}</Fragment>
      ))}
      {obj.metadata && (
        <SectionBox title="Metadata">
          <RawJsonViewer data={obj.metadata} />
        </SectionBox>
      )}
    </>
  );
}
