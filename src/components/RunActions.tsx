// SPDX-License-Identifier: EPL-2.0

import { ActionButton, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useState } from 'react';

type RunActionVariant = 'section' | 'compact';

type RunAction = {
  id: string;
  label: string;
  run: () => Promise<any>;
  color?: 'primary' | 'warning' | 'error';
};

const meta = (item: any) => item?.metadata || item?.jsonData?.metadata || {};
const spec = (item: any) => item?.spec || item?.jsonData?.spec || {};
const status = (item: any) => item?.status || item?.jsonData?.status || {};
const kindOf = (item: any) => item?.kind || item?.jsonData?.kind || item?._class?.()?.kind || item?.constructor?.kind;

export function isTektonRunResource(item: any) {
  const itemKind = kindOf(item);
  return itemKind === 'PipelineRun' || itemKind === 'TaskRun';
}

function firstCondition(item: any) {
  return status(item).conditions?.find((condition: any) => condition.type === 'Succeeded') || status(item).conditions?.[0];
}

function isDone(item: any) {
  const condition = firstCondition(item);
  return Boolean(status(item).completionTime || (condition && condition.status !== 'Unknown'));
}

function isPending(item: any) {
  const itemSpec = spec(item);
  const condition = firstCondition(item);
  return (
    itemSpec.status === 'PipelineRunPending' ||
    itemSpec.status === 'TaskRunPending' ||
    condition?.reason === 'PipelineRunPending' ||
    condition?.reason === 'TaskRunPending'
  );
}

function isRunning(item: any) {
  const condition = firstCondition(item);
  return Boolean(
    status(item).startTime &&
      !isDone(item) &&
      !isPending(item) &&
      (!condition || condition.status === 'Unknown')
  );
}

function runName(item: any) {
  return meta(item).name || 'run';
}

function cleanMetadataForRerun(item: any) {
  const metadata = meta(item);
  return {
    generateName: `${runName(item)}-rerun-`,
    namespace: metadata.namespace,
    labels: metadata.labels,
    annotations: metadata.annotations,
  };
}

async function patchRunStatus(item: any, nextStatus: string) {
  return item.patch({ spec: { status: nextStatus } });
}

async function rerun(item: any) {
  const itemKind = kindOf(item);
  const itemSpec = { ...spec(item) };
  delete itemSpec.status;
  delete itemSpec.statusMessage;

  const body = {
    apiVersion: item?.apiVersion || item?.jsonData?.apiVersion || (itemKind === 'TaskRun' ? 'tekton.dev/v1' : 'tekton.dev/v1'),
    kind: itemKind,
    metadata: cleanMetadataForRerun(item),
    spec: itemSpec,
  };

  return item._class().apiEndpoint.post(body, {}, item.cluster || item._clusterName);
}

function actionsFor(item: any): RunAction[] {
  const itemKind = kindOf(item);
  if (!isTektonRunResource(item)) return [];

  const actions: RunAction[] = [];
  const pending = isPending(item);
  const running = isRunning(item);
  const done = isDone(item);

  if (pending) {
    actions.push({
      id: 'resume',
      label: 'Resume',
      run: () => patchRunStatus(item, ''),
      color: 'primary',
    });
  }

  if (itemKind === 'PipelineRun' && running) {
    actions.push(
      {
        id: 'cancel',
        label: 'Cancel',
        run: () => patchRunStatus(item, 'Cancelled'),
        color: 'error',
      },
      {
        id: 'cancel-finally',
        label: 'Cancel + Finally',
        run: () => patchRunStatus(item, 'CancelledRunFinally'),
        color: 'warning',
      },
      {
        id: 'stop-finally',
        label: 'Stop + Finally',
        run: () => patchRunStatus(item, 'StoppedRunFinally'),
        color: 'warning',
      }
    );
  }

  if (itemKind === 'TaskRun' && (running || pending)) {
    actions.push({
      id: 'cancel',
      label: 'Cancel',
      run: () => patchRunStatus(item, 'TaskRunCancelled'),
      color: 'error',
    });
  }

  if (done) {
    actions.push({
      id: 'rerun',
      label: 'Rerun',
      run: () => rerun(item),
      color: 'primary',
    });
  }

  return actions;
}

function actionIcon(action: RunAction) {
  switch (action.id) {
    case 'resume':
      return 'mdi:play-circle-outline';
    case 'rerun':
      return 'mdi:replay';
    case 'stop-finally':
      return 'mdi:stop-circle-outline';
    default:
      return 'mdi:cancel';
  }
}

function actionColor(action: RunAction) {
  switch (action.color) {
    case 'error':
      return '#d32f2f';
    case 'warning':
      return '#ed6c02';
    default:
      return undefined;
  }
}

export function TektonRunActions({
  item,
  variant = 'section',
}: {
  item: any;
  variant?: RunActionVariant;
}) {
  const actions = actionsFor(item);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (actions.length === 0) return null;

  const runAction = async (action: RunAction) => {
    setBusyAction(action.id);
    setMessage('');
    try {
      await action.run();
      setMessage(action.id === 'rerun' ? 'Rerun created' : 'Requested');
    } catch (err: any) {
      setMessage(err?.message || 'Action failed');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
        {actions.map(action => (
          <Button
            key={action.id}
            size={variant === 'compact' ? 'small' : 'medium'}
            variant={variant === 'compact' ? 'outlined' : 'contained'}
            color={action.color || 'primary'}
            disabled={Boolean(busyAction)}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              runAction(action);
            }}
          >
            {busyAction === action.id ? 'Working...' : action.label}
          </Button>
        ))}
        {message && (
          <StatusLabel status={message === 'Requested' || message === 'Rerun created' ? 'success' : 'error'}>
            {message}
          </StatusLabel>
        )}
      </Stack>
    </Box>
  );
}

export function TektonRunHeaderActions({ item }: { item: any }) {
  const actions = actionsFor(item);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  if (actions.length === 0) return null;

  const runAction = async (action: RunAction) => {
    setBusyAction(action.id);
    try {
      await action.run();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Stack direction="row" spacing={0.5}>
      {actions.map(action => (
        <ActionButton
          key={action.id}
          description={busyAction === action.id ? 'Working...' : action.label}
          icon={actionIcon(action)}
          color={actionColor(action)}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            if (!busyAction) {
              runAction(action);
            }
          }}
          iconButtonProps={{ disabled: Boolean(busyAction) }}
        />
      ))}
    </Stack>
  );
}
