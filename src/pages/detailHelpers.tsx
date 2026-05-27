// SPDX-License-Identifier: EPL-2.0

import {
  ConditionsSection,
  Link,
  NameValueTable,
  PercentageCircle,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Editor } from '@monaco-editor/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { TektonRunActions } from '../components/RunActions';
import { RawJsonViewer } from './RawJSONViewer';

const spec = (item: any) => item?.spec || item?.jsonData?.spec || {};
const status = (item: any) => item?.status || item?.jsonData?.status || {};
const metadata = (item: any) => item?.metadata || item?.jsonData?.metadata || {};

function listValue(value: any) {
  if (!value) return '-';
  if (Array.isArray(value)) return value.join(', ') || '-';
  return String(value);
}

function objectName(value: any) {
  return value?.name || value?.ref || value?.resource || '-';
}

function softBreakUrl(value: string) {
  return value.replace(/([/:.=\-])/g, '$1\u200b');
}

function LongValue({ value }: { value: string }) {
  return (
    <Box
      component="span"
      title={value}
      sx={{
        display: 'inline',
        maxWidth: '100%',
        minWidth: 0,
        whiteSpace: 'normal',
        overflowWrap: 'normal',
        wordBreak: 'normal',
        lineHeight: 1.35,
      }}
    >
      {softBreakUrl(value)}
    </Box>
  );
}

function triggerTemplateRef(trigger: any, defaultNamespace?: string) {
  const template = trigger?.template || {};
  const name =
    template?.ref?.name ||
    template?.ref ||
    template?.name ||
    template?.resource ||
    '';
  const namespace =
    template?.ref?.namespace ||
    template?.namespace ||
    defaultNamespace;

  return { namespace, name };
}

function firstCondition(item: any) {
  return status(item).conditions?.[0];
}

function statusType(condition: any): 'success' | 'warning' | 'error' | '' {
  if (!condition) return '';
  if (condition.status === 'True') return 'success';
  if (condition.status === 'False') return 'error';
  return 'warning';
}

function conditionText(condition: any) {
  if (!condition) return 'Unknown';
  return condition.reason || condition.type || condition.status || 'Unknown';
}

export function durationText(start?: string, end?: string) {
  if (!start) return '-';
  const startTime = Date.parse(start);
  const endTime = end ? Date.parse(end) : Date.now();
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return '-';
  const seconds = Math.max(0, Math.round((endTime - startTime) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function progressStats(value: number, total: number) {
  const safeTotal = Math.max(total, value, 0);
  return {
    value,
    total: safeTotal,
    percentage: safeTotal ? Math.round((value / safeTotal) * 100) : 0,
  };
}

function resourceRoute(kind?: string) {
  switch (kind) {
    case 'Pipeline':
      return 'pipeline-details';
    case 'PipelineRun':
      return 'pipelinerun-details';
    case 'Task':
      return 'task-details';
    case 'TaskRun':
      return 'taskrun-details';
    case 'TriggerBinding':
      return 'trigger-binding-details';
    case 'TriggerTemplate':
      return 'trigger-template-details';
    case 'EventListener':
      return 'event-listener-details';
    case 'ClusterInterceptor':
      return 'clusterinterceptor-details';
    default:
      return null;
  }
}

function ResourceLink({
  kind,
  name,
  namespace,
}: {
  kind?: string;
  name?: string;
  namespace?: string;
}) {
  const routeName = resourceRoute(kind);
  if (!routeName || !name) return <>{name || '-'}</>;

  const params: Record<string, string> = { name };
  if (kind !== 'ClusterInterceptor' && namespace) {
    params.namespace = namespace;
  }

  return (
    <Link routeName={routeName} params={params}>
      {name}
    </Link>
  );
}

export function tektonStatusLabel(item: any) {
  const condition = firstCondition(item);
  return <StatusLabel status={statusType(condition)}>{conditionText(condition)}</StatusLabel>;
}

export function mainInfoRows(item: any) {
  const kind = item?.kind || item?.jsonData?.kind;
  const s = spec(item);
  const st = status(item);

  if (kind === 'Pipeline') {
    return [
      { name: 'Tasks', value: s.tasks?.length ?? 0 },
      { name: 'Finally Tasks', value: s.finally?.length ?? 0 },
      { name: 'Params', value: s.params?.length ?? 0 },
      { name: 'Workspaces', value: s.workspaces?.length ?? 0 },
    ];
  }

  if (kind === 'PipelineRun') {
    return [
      {
        name: 'Pipeline',
        value: s.pipelineRef?.name ? (
          <ResourceLink kind="Pipeline" name={s.pipelineRef.name} namespace={metadata(item).namespace} />
        ) : (
          s.pipelineSpec ? 'Inline pipelineSpec' : '-'
        ),
      },
      { name: 'Status', value: tektonStatusLabel(item) },
      { name: 'Task Runs', value: st.childReferences?.length ?? 0 },
      { name: 'Duration', value: durationText(st.startTime, st.completionTime) },
    ];
  }

  if (kind === 'Task') {
    return [
      { name: 'Steps', value: s.steps?.length ?? 0 },
      { name: 'Params', value: s.params?.length ?? 0 },
      { name: 'Results', value: s.results?.length ?? 0 },
      { name: 'Workspaces', value: s.workspaces?.length ?? 0 },
    ];
  }

  if (kind === 'TaskRun') {
    return [
      {
        name: 'Task',
        value: s.taskRef?.name ? (
          <ResourceLink kind="Task" name={s.taskRef.name} namespace={metadata(item).namespace} />
        ) : (
          s.taskSpec ? 'Inline taskSpec' : '-'
        ),
      },
      { name: 'Status', value: tektonStatusLabel(item) },
      { name: 'Steps', value: st.steps?.length ?? 0 },
      { name: 'Duration', value: durationText(st.startTime, st.completionTime) },
    ];
  }

  if (kind === 'TriggerTemplate') {
    return [
      { name: 'Params', value: s.params?.length ?? 0 },
      { name: 'Resource Templates', value: s.resourcetemplates?.length ?? 0 },
    ];
  }

  if (kind === 'TriggerBinding') {
    return [{ name: 'Params', value: s.params?.length ?? 0 }];
  }

  if (kind === 'EventListener') {
    const address = st.address?.url || '-';
    return [
      { name: 'Triggers', value: s.triggers?.length ?? 0 },
      { name: 'Service Account', value: s.serviceAccountName || s.taskRunTemplate?.serviceAccountName || '-' },
      {
        name: 'Namespace Selector',
        value: s.namespaceSelector?.matchNames?.join(', ') || (s.namespaceSelector ? 'Configured' : '-'),
      },
      { name: 'Address', value: address === '-' ? '-' : <LongValue value={address} /> },
    ];
  }

  if (kind === 'ClusterInterceptor') {
    return [
      { name: 'Client Config', value: s.clientConfig ? 'Configured' : 'None' },
      { name: 'Params', value: s.params?.length ?? 0 },
    ];
  }

  return [];
}

export function RawSection({ id, title, data }: { id: string; title: string; data: any }): any {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return false;
  return {
    id,
    section: (
      <SectionBox title={title}>
        <RawJsonViewer data={data} />
      </SectionBox>
    ),
  };
}

export function ParamsSection({ params }: { params?: any[] }) {
  return (
    <SectionBox title="Params">
      <SimpleTable
        data={params || []}
        emptyMessage="No params."
        columns={[
          { label: 'Name', getter: param => param.name || '-' },
          { label: 'Value', getter: param => param.value ?? param.default ?? '-' },
          { label: 'Description', getter: param => param.description || '-' },
        ]}
      />
    </SectionBox>
  );
}

export function WorkspacesSection({ workspaces }: { workspaces?: any[] }) {
  return (
    <SectionBox title="Workspaces">
      <SimpleTable
        data={workspaces || []}
        emptyMessage="No workspaces."
        columns={[
          { label: 'Name', getter: workspace => workspace.name || '-' },
          { label: 'Description', getter: workspace => workspace.description || '-' },
          { label: 'Optional', getter: workspace => (workspace.optional ? 'Yes' : 'No') },
        ]}
      />
    </SectionBox>
  );
}

export function PipelineTasksSection({
  title,
  tasks,
  namespace,
}: {
  title: string;
  tasks?: any[];
  namespace?: string;
}) {
  return (
    <SectionBox title={title}>
      <SimpleTable
        data={tasks || []}
        emptyMessage={`No ${title.toLowerCase()}.`}
        columns={[
          { label: 'Name', getter: task => task.name || '-' },
          {
            label: 'Task',
            getter: task =>
              task.taskRef?.name ? (
                <ResourceLink kind="Task" name={task.taskRef.name} namespace={namespace} />
              ) : (
                'Inline taskSpec'
              ),
          },
          { label: 'Run After', getter: task => listValue(task.runAfter) },
          { label: 'Params', getter: task => task.params?.length ?? 0 },
          { label: 'When', getter: task => task.when?.length ?? 0 },
        ]}
      />
    </SectionBox>
  );
}

export function StepsSection({ steps }: { steps?: any[] }) {
  return (
    <SectionBox title="Steps">
      <SimpleTable
        data={steps || []}
        emptyMessage="No steps."
        columns={[
          { label: 'Name', getter: step => step.name || '-' },
          { label: 'Image', getter: step => step.image || '-' },
          { label: 'Command', getter: step => listValue(step.command) },
          { label: 'Args', getter: step => listValue(step.args) },
          { label: 'Script', getter: step => (step.script ? 'Yes' : 'No') },
        ]}
      />
    </SectionBox>
  );
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function stepScriptEntries(steps?: any[]) {
  return (steps || [])
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => typeof step?.script === 'string');
}

function stepScriptTitle(step: any, index: number) {
  return step?.name || `Step ${index + 1}`;
}

function StepScriptEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  const [height, setHeight] = useState(120);

  return (
    <Box
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Editor
        value={value}
        language="shell"
        height={Math.min(Math.max(height, 120), 420)}
        theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
        onChange={nextValue => onChange(nextValue ?? '')}
        onMount={editor => {
          const updateHeight = () => setHeight(editor.getContentHeight());
          updateHeight();
          editor.onDidContentSizeChange(updateHeight);
        }}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 12,
          lineNumbers: 'off',
          wordWrap: 'on',
        }}
      />
    </Box>
  );
}

export function StepScriptsSection({ item }: { item: any }) {
  const itemSpec = spec(item);
  const scripts = stepScriptEntries(itemSpec.steps);
  const scriptSnapshot = JSON.stringify(scripts.map(({ step, index }) => [index, step.script || '']));
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(scripts.map(({ step, index }) => [index, step.script || '']))
  );
  const [isDirty, setIsDirty] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (isDirty) return;
    setValues(Object.fromEntries(scripts.map(({ step, index }) => [index, step.script || ''])));
  }, [scriptSnapshot, isDirty]);

  if (scripts.length === 0) return null;

  const updateScript = (index: number, value: string) => {
    setValues(current => ({ ...current, [index]: value }));
    setIsDirty(true);
    setStatusText('');
  };

  const saveScripts = async () => {
    const nextResource = cloneJson(item.jsonData || item);
    nextResource.spec = nextResource.spec || {};
    nextResource.spec.steps = [...(nextResource.spec.steps || [])];
    scripts.forEach(({ index }) => {
      nextResource.spec.steps[index] = {
        ...(nextResource.spec.steps[index] || {}),
        script: values[index] ?? '',
      };
    });

    try {
      await item.update(nextResource);
      setIsDirty(false);
      setStatusText('Saved');
    } catch (err: any) {
      setStatusText(err?.message || 'Save failed');
    }
  };

  return (
    <SectionBox title="Step Scripts">
      <NameValueTable
        rows={scripts.map(({ step, index }) => {
          const title = stepScriptTitle(step, index);
          return {
            name: title,
            value: (
              <StepScriptEditor
                value={values[index] ?? ''}
                onChange={value => updateScript(index, value)}
              />
            ),
          };
        })}
      />
      <Box mt={2} display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
        {statusText && <StatusLabel status={statusText === 'Saved' ? 'success' : 'error'}>{statusText}</StatusLabel>}
        <Button variant="contained" color="primary" disabled={!isDirty} onClick={saveScripts}>
          Save
        </Button>
      </Box>
    </SectionBox>
  );
}

export function ResultsSection({ results }: { results?: any[] }) {
  return (
    <SectionBox title="Results">
      <SimpleTable
        data={results || []}
        emptyMessage="No results."
        columns={[
          { label: 'Name', getter: result => result.name || '-' },
          { label: 'Type', getter: result => result.type || '-' },
          { label: 'Description', getter: result => result.description || '-' },
          { label: 'Value', getter: result => result.value || '-' },
        ]}
      />
    </SectionBox>
  );
}

export function ChildReferencesSection({ item }: { item: any }) {
  const refs = status(item).childReferences || [];
  const ns = metadata(item).namespace;
  return (
    <SectionBox title="Child References">
      <SimpleTable
        data={refs}
        emptyMessage="No child references."
        columns={[
          { label: 'Kind', getter: ref => ref.kind || '-' },
          {
            label: 'Name',
            getter: ref => <ResourceLink kind={ref.kind} name={ref.name} namespace={ns} />,
          },
          { label: 'Pipeline Task', getter: ref => ref.pipelineTaskName || '-' },
        ]}
      />
    </SectionBox>
  );
}

export function RunProgressSection({ item }: { item: any }) {
  const kind = item?.kind || item?.jsonData?.kind;
  const s = spec(item);
  const st = status(item);

  if (kind === 'PipelineRun') {
    const created = st.childReferences?.filter((ref: any) => ref.kind === 'TaskRun').length ?? 0;
    const runtimeSpec = st.pipelineSpec || s.pipelineSpec || {};
    const declared = (runtimeSpec.tasks?.length || 0) + (runtimeSpec.finally?.length || 0) || created;
    const progress = progressStats(created, declared);
    if (!progress.total) return null;

    return (
      <SectionBox title="Task Run Progress">
        <PercentageCircle
          size={140}
          thickness={11}
          total={progress.total}
          label={`${progress.percentage}%`}
          data={[{ name: 'Created', value: progress.value }]}
          legend={`${progress.value}/${progress.total} task runs created`}
        />
      </SectionBox>
    );
  }

  if (kind === 'TaskRun') {
    const steps = st.steps || [];
    const terminated = steps.filter((step: any) => step.terminated).length;
    const progress = progressStats(terminated, steps.length);
    if (!progress.total) return null;

    return (
      <SectionBox title="Step Progress">
        <PercentageCircle
          size={140}
          thickness={11}
          total={progress.total}
          label={`${progress.percentage}%`}
          data={[{ name: 'Terminated', value: progress.value }]}
          legend={`${progress.value}/${progress.total} steps terminated`}
        />
      </SectionBox>
    );
  }

  return null;
}

export function StepStatusSection({ steps }: { steps?: any[] }) {
  return (
    <SectionBox title="Step Status">
      <SimpleTable
        data={steps || []}
        emptyMessage="No step status."
        columns={[
          { label: 'Name', getter: step => step.name || '-' },
          { label: 'Container', getter: step => step.container || '-' },
          {
            label: 'State',
            getter: step =>
              step.terminated ? (
                <StatusLabel status={step.terminated.exitCode === 0 ? 'success' : 'error'}>
                  {step.terminated.reason || `Exit ${step.terminated.exitCode}`}
                </StatusLabel>
              ) : step.running ? (
                <StatusLabel status="warning">Running</StatusLabel>
              ) : (
                <StatusLabel status="">Waiting</StatusLabel>
              ),
          },
          { label: 'Image ID', getter: step => step.imageID || '-' },
        ]}
      />
    </SectionBox>
  );
}

export function ConditionsSummarySection({ item }: { item: any }) {
  const conditions = status(item).conditions || [];
  if (conditions.length > 0) {
    return <ConditionsSection resource={item.jsonData || item} />;
  }

  return (
    <SectionBox title="Conditions">
      <SimpleTable
        data={conditions}
        emptyMessage="No conditions."
        columns={[
          { label: 'Type', getter: condition => condition.type || '-' },
          { label: 'Status', getter: condition => condition.status || '-' },
          { label: 'Reason', getter: condition => condition.reason || '-' },
          { label: 'Message', getter: condition => condition.message || '-' },
        ]}
      />
    </SectionBox>
  );
}

export function TriggerTemplatesSection({ templates }: { templates?: any[] }) {
  return (
    <SectionBox title="Resource Templates">
      <SimpleTable
        data={templates || []}
        emptyMessage="No resource templates."
        columns={[
          { label: 'Kind', getter: template => template.kind || '-' },
          { label: 'Name', getter: template => template.metadata?.name || template.metadata?.generateName || '-' },
          { label: 'API Version', getter: template => template.apiVersion || '-' },
        ]}
      />
    </SectionBox>
  );
}

export function EventTriggersSection({ triggers, namespace }: { triggers?: any[]; namespace?: string }) {
  return (
    <SectionBox title="Triggers">
      <SimpleTable
        data={triggers || []}
        emptyMessage="No triggers."
        columns={[
          { label: 'Name', getter: trigger => trigger.name || '-' },
          {
            label: 'Template',
            getter: trigger => {
              const ref = triggerTemplateRef(trigger, namespace);
              return <ResourceLink kind="TriggerTemplate" name={ref.name} namespace={ref.namespace} />;
            },
          },
          {
            label: 'Bindings',
            getter: trigger =>
              (trigger.bindings || [])
                .map((binding: any) => objectName(binding.ref || binding))
                .join(', ') || '-',
          },
          { label: 'Interceptors', getter: trigger => trigger.interceptors?.length ?? 0 },
        ]}
      />
    </SectionBox>
  );
}

export function ClientConfigSection({ clientConfig }: { clientConfig: any }): any {
  if (!clientConfig) return false;

  return {
    id: 'client-config',
    section: (
      <SectionBox title="Client Config">
        <NameValueTable
          rows={[
            { name: 'Service', value: clientConfig.service?.name || '-' },
            { name: 'Namespace', value: clientConfig.service?.namespace || '-' },
            { name: 'Path', value: clientConfig.service?.path || clientConfig.url || '-' },
          ]}
        />
      </SectionBox>
    ),
  };
}

export function extraSectionsFor(item: any): any[] {
  const kind = item?.kind || item?.jsonData?.kind;
  const s = spec(item);
  const st = status(item);
  const ns = metadata(item).namespace;

  if (kind === 'Pipeline') {
    return [
      { id: 'tasks', section: <PipelineTasksSection title="Tasks" tasks={s.tasks} namespace={ns} /> },
      { id: 'finally', section: <PipelineTasksSection title="Finally Tasks" tasks={s.finally} namespace={ns} /> },
      { id: 'params', section: <ParamsSection params={s.params} /> },
      { id: 'workspaces', section: <WorkspacesSection workspaces={s.workspaces} /> },
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  if (kind === 'PipelineRun') {
    return [
      {
        id: 'run-actions',
        section: (
          <SectionBox title="Run Actions">
            <TektonRunActions item={item} />
          </SectionBox>
        ),
      },
      { id: 'conditions', section: <ConditionsSummarySection item={item} /> },
      { id: 'run-progress', section: <RunProgressSection item={item} /> },
      { id: 'child-references', section: <ChildReferencesSection item={item} /> },
      { id: 'params', section: <ParamsSection params={s.params} /> },
      { id: 'workspaces', section: <WorkspacesSection workspaces={s.workspaces} /> },
      RawSection({ id: 'raw-status', title: 'Raw Status', data: st }),
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  if (kind === 'Task') {
    return [
      { id: 'steps', section: <StepsSection steps={s.steps} /> },
      stepScriptEntries(s.steps).length > 0 && {
        id: 'step-scripts',
        section: <StepScriptsSection item={item} />,
      },
      { id: 'params', section: <ParamsSection params={s.params} /> },
      { id: 'results', section: <ResultsSection results={s.results} /> },
      { id: 'workspaces', section: <WorkspacesSection workspaces={s.workspaces} /> },
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  if (kind === 'TaskRun') {
    return [
      {
        id: 'run-actions',
        section: (
          <SectionBox title="Run Actions">
            <TektonRunActions item={item} />
          </SectionBox>
        ),
      },
      { id: 'conditions', section: <ConditionsSummarySection item={item} /> },
      { id: 'run-progress', section: <RunProgressSection item={item} /> },
      { id: 'step-status', section: <StepStatusSection steps={st.steps} /> },
      { id: 'params', section: <ParamsSection params={s.params} /> },
      RawSection({ id: 'raw-status', title: 'Raw Status', data: st }),
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  if (kind === 'TriggerTemplate') {
    return [
      { id: 'params', section: <ParamsSection params={s.params} /> },
      { id: 'resource-templates', section: <TriggerTemplatesSection templates={s.resourcetemplates} /> },
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  if (kind === 'TriggerBinding') {
    return [
      { id: 'params', section: <ParamsSection params={s.params} /> },
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  if (kind === 'EventListener') {
    return [
      { id: 'conditions', section: <ConditionsSummarySection item={item} /> },
      { id: 'triggers', section: <EventTriggersSection triggers={s.triggers} namespace={ns} /> },
      RawSection({ id: 'raw-status', title: 'Raw Status', data: st }),
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  if (kind === 'ClusterInterceptor') {
    return [
      ClientConfigSection({ clientConfig: s.clientConfig }),
      { id: 'params', section: <ParamsSection params={s.params} /> },
      RawSection({ id: 'raw-spec', title: 'Raw Spec', data: s }),
    ].filter(Boolean);
  }

  return [];
}

export { listValue, spec, status, metadata, ResourceLink };
