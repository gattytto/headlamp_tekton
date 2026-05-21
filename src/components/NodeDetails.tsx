// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/components/NodeDetails.tsx

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { RawJsonViewer } from '../pages/RawJSONViewer';

type Props = {
  node?: {
    id?: string;
    label?: string;
    type?: string; // synthetic node type (step, trigger, etc.)
    data?: any;    // payload for synthetic nodes
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
      {
        name: 'Status',
        value: obj.status?.conditions?.[0]?.type ?? 'Unknown',
      },
      {
        name: 'Start Time',
        value: obj.status?.startTime ?? '-',
      },
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
      {
        name: 'Status',
        value: obj.status?.conditions?.[0]?.type ?? 'Unknown',
      },
      {
        name: 'Steps',
        value: obj.status?.steps?.length ?? 0,
      },
    ];
  }

  if (kind === 'TriggerBinding') {
    return [{ name: 'Params', value: obj.spec?.params?.length ?? 0 }];
  }

  if (kind === 'TriggerTemplate') {
    return [
      { name: 'Params', value: obj.spec?.params?.length ?? 0 },
      {
        name: 'Resources',
        value: obj.spec?.resourcetemplates?.length ?? 0,
      },
    ];
  }

  if (kind === 'EventListener') {
    return [
      { name: 'Triggers', value: obj.spec?.triggers?.length ?? 0 },
      {
        name: 'ServiceAccount',
        value: obj.spec?.serviceAccountName ?? '-',
      },
    ];
  }

  if (kind === 'ClusterInterceptor') {
    return [
      {
        name: 'ClientConfig',
        value: obj.spec?.clientConfig ? 'Configured' : 'None',
      },
    ];
  }

  return [];
}

function renderSyntheticFields(node: any) {
  if (node.type === 'step') {
    return [
      { name: 'Step Name', value: node.data?.name ?? node.label ?? '-' },
      { name: 'Image', value: node.data?.image ?? '-' },
      {
        name: 'Command',
        value: node.data?.command?.join(' ') ?? '-',
      },
    ];
  }

  if (node.type === 'trigger') {
    return [
      { name: 'Trigger Name', value: node.data?.name ?? node.label ?? '-' },
      {
        name: 'Bindings',
        value: node.data?.bindings?.length ?? 0,
      },
      {
        name: 'Template',
        value: node.data?.template ?? '-',
      },
    ];
  }

  return [];
}

function InfoGrid({ fields }: { fields: { name: string; value: any }[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        rowGap: 6,
        columnGap: 12,
        fontSize: 13,
      }}
    >
      {fields.map((f, i) => (
        <div key={i} style={{ display: 'contents' }}>
          <div style={{ fontWeight: 600 }}>{f.name}</div>
          <div>{String(f.value)}</div>
        </div>
      ))}
    </div>
  );
}

export function NodeDetails({ node }: Props) {
  if (!node) {
    return <div style={{ padding: 12 }}>No node selected</div>;
  }

  const obj = node.kubeObject;

  // ============================
  // SYNTHETIC NODE (STEP, TRIGGER, ETC)
  // ============================
  if (!obj) {
    const fields = renderSyntheticFields(node);

    return (
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{node.label || node.id}</h3>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Type: {node.type ?? 'synthetic'}
          </div>
        </div>

        {fields.length > 0 && (
          <SectionBox title="Details">
            <InfoGrid fields={fields} />
          </SectionBox>
        )}

        {node.data && (
          <SectionBox title="Raw Data">
            <RawJsonViewer data={node.data} />
          </SectionBox>
        )}
      </div>
    );
  }

  // ============================
  // REAL K8s OBJECT
  // ============================

  const fields = renderFields(obj);

  return (
    <div style={{ padding: 12 }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{node.label || node.id}</h3>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Kind: {obj.kind}
        </div>
      </div>

      {/* Structured info */}
      {fields.length > 0 && (
        <SectionBox title="Details">
          <InfoGrid fields={fields} />
        </SectionBox>
      )}

      {/* Spec */}
      {obj.spec && (
        <SectionBox title="Spec">
          <RawJsonViewer data={obj.spec} />
        </SectionBox>
      )}

      {/* 👇 TASK STEPS (important Tekton UX fix) */}
      {obj.kind === 'Task' && obj.spec?.steps && (
        <SectionBox title="Steps">
          <RawJsonViewer data={obj.spec.steps} />
        </SectionBox>
      )}

      {/* Status */}
      {obj.status && (
        <SectionBox title="Status">
          <RawJsonViewer data={obj.status} />
        </SectionBox>
      )}

      {/* Metadata */}
      <SectionBox title="Metadata">
        <RawJsonViewer data={obj.metadata} />
      </SectionBox>
    </div>
  );
}