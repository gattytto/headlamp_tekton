// SPDX-License-Identifier: EPL-2.0

import { DetailsGrid, NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ClusterInterceptorClass } from '../crd/clusterinterceptor';
import { EventListenerClass } from '../crd/eventlistener';
import { PipelineClass } from '../crd/pipeline';
import { PipelineRunClass } from '../crd/pipelinerun';
import { TaskClass } from '../crd/task';
import { TaskRunClass } from '../crd/taskrun';
import { TriggerBindingClass } from '../crd/trigger';
import { TriggerTemplateClass } from '../crd/triggertemplate';
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

function renderFields(obj: any) {
  const kind = obj?.kind;

  if (kind === 'Pipeline') {
    return [
      { name: 'Name', value: obj.metadata?.name ?? '-' },
      { name: 'Tasks', value: obj.spec?.tasks?.length ?? 0 },
      { name: 'Finally Tasks', value: obj.spec?.finally?.length ?? 0 },
    ];
  }

  if (kind === 'PipelineRun') {
    return [
      { name: 'Pipeline', value: obj.spec?.pipelineRef?.name ?? '-' },
      { name: 'Status', value: obj.status?.conditions?.[0]?.type ?? 'Unknown' },
      { name: 'Start Time', value: obj.status?.startTime ?? '-' },
    ];
  }

  if (kind === 'Task') {
    return [
      { name: 'Name', value: obj.metadata?.name ?? '-' },
      { name: 'Steps', value: obj.spec?.steps?.length ?? 0 },
    ];
  }

  if (kind === 'TaskRun') {
    return [
      { name: 'Task', value: obj.spec?.taskRef?.name ?? '-' },
      { name: 'Status', value: obj.status?.conditions?.[0]?.type ?? 'Unknown' },
      { name: 'Steps', value: obj.status?.steps?.length ?? 0 },
    ];
  }

  if (kind === 'TriggerBinding') {
    return [{ name: 'Params', value: obj.spec?.params?.length ?? 0 }];
  }

  if (kind === 'TriggerTemplate') {
    return [
      { name: 'Params', value: obj.spec?.params?.length ?? 0 },
      { name: 'Resources', value: obj.spec?.resourcetemplates?.length ?? 0 },
    ];
  }

  if (kind === 'EventListener') {
    return [
      { name: 'Triggers', value: obj.spec?.triggers?.length ?? 0 },
      { name: 'ServiceAccount', value: obj.spec?.serviceAccountName ?? '-' },
    ];
  }

  if (kind === 'ClusterInterceptor') {
    return [{ name: 'ClientConfig', value: obj.spec?.clientConfig ? 'Configured' : 'None' }];
  }

  return [];
}

function renderSyntheticFields(node: any) {
  if (node.type === 'step') {
    return [
      { name: 'Step Name', value: node.data?.name ?? node.label ?? '-' },
      { name: 'Image', value: node.data?.image ?? '-' },
      { name: 'Command', value: node.data?.command?.join(' ') ?? '-' },
    ];
  }

  if (node.type === 'trigger') {
    return [
      { name: 'Trigger Name', value: node.data?.name ?? node.label ?? '-' },
      { name: 'Bindings', value: node.data?.bindings?.length ?? 0 },
      { name: 'Template', value: node.data?.template ?? '-' },
    ];
  }

  return [];
}

export function NodeDetails({ node }: Props) {
  if (!node) {
    return <SectionBox title="Details">No node selected</SectionBox>;
  }

  const obj = node.kubeObject;

  if (!obj) {
    const fields = renderSyntheticFields(node);

    return (
      <>
        <SectionBox title={node.label || node.id || 'Synthetic Node'}>
          <NameValueTable rows={[{ name: 'Type', value: node.type ?? 'synthetic' }]} />
        </SectionBox>
        {fields.length > 0 && (
          <SectionBox title="Details">
            <NameValueTable rows={fields} />
          </SectionBox>
        )}
        {node.data && (
          <SectionBox title="Raw Data">
            <RawJsonViewer data={node.data} />
          </SectionBox>
        )}
      </>
    );
  }

  const resourceType =
    obj.kind === 'Pipeline'
      ? PipelineClass
      : obj.kind === 'PipelineRun'
        ? PipelineRunClass
        : obj.kind === 'Task'
          ? TaskClass
          : obj.kind === 'TaskRun'
            ? TaskRunClass
            : obj.kind === 'TriggerBinding'
              ? TriggerBindingClass
              : obj.kind === 'TriggerTemplate'
                ? TriggerTemplateClass
                : obj.kind === 'EventListener'
                  ? EventListenerClass
                  : obj.kind === 'ClusterInterceptor'
                    ? ClusterInterceptorClass
                    : null;

  if (resourceType && obj.metadata?.name) {
    return (
      <DetailsGrid
        resourceType={resourceType as any}
        name={obj.metadata.name}
        namespace={obj.metadata.namespace}
        withEvents
        extraInfo={item => item && renderFields(item)}
        extraSections={item =>
          item
            ? [
                item.kind === 'Task' &&
                  item.spec?.steps && {
                    id: 'steps',
                    section: (
                      <SectionBox title="Steps">
                        <RawJsonViewer data={item.spec.steps} />
                      </SectionBox>
                    ),
                  },
                item.status && {
                  id: 'status',
                  section: (
                    <SectionBox title="Status">
                      <RawJsonViewer data={item.status} />
                    </SectionBox>
                  ),
                },
                item.spec && {
                  id: 'spec',
                  section: (
                    <SectionBox title="Spec">
                      <RawJsonViewer data={item.spec} />
                    </SectionBox>
                  ),
                },
              ].filter(Boolean)
            : []
        }
      />
    );
  }

  const fields = renderFields(obj);

  return (
    <>
      <SectionBox title={node.label || node.id || 'Details'}>
        <NameValueTable rows={[{ name: 'Kind', value: obj.kind }]} />
      </SectionBox>

      {fields.length > 0 && (
        <SectionBox title="Details">
          <NameValueTable rows={fields} />
        </SectionBox>
      )}

      {obj.spec && (
        <SectionBox title="Spec">
          <RawJsonViewer data={obj.spec} />
        </SectionBox>
      )}

      {obj.kind === 'Task' && obj.spec?.steps && (
        <SectionBox title="Steps">
          <RawJsonViewer data={obj.spec.steps} />
        </SectionBox>
      )}

      {obj.status && (
        <SectionBox title="Status">
          <RawJsonViewer data={obj.status} />
        </SectionBox>
      )}

      <SectionBox title="Metadata">
        <RawJsonViewer data={obj.metadata} />
      </SectionBox>
    </>
  );
}
