// SPDX-License-Identifier: EPL-2.0

import Box from '@mui/material/Box';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { mainInfoRows } from '../pages/detailHelpers';

const kind = (obj: any) => obj?.kind || obj?.jsonData?.kind || obj?._class?.()?.kind || obj?.constructor?.kind;
const tektonKinds = [
  'Pipeline',
  'PipelineRun',
  'Task',
  'TaskRun',
  'TriggerBinding',
  'TriggerTemplate',
  'EventListener',
  'ClusterInterceptor',
];

function glanceObject(node: any) {
  const direct = [
    node?.kubeObject,
    node?.data?.kubeObject,
    node?.data?.data,
    node?.data,
    node,
  ].find(item => tektonKinds.includes(kind(item)));
  if (direct) return direct;

  return (node?.nodes || []).map(glanceObject).find(Boolean);
}

export function TektonGlance({ node }: { node: any }) {
  const obj = glanceObject(node);

  if (!tektonKinds.includes(kind(obj))) {
    return null;
  }

  const rows = mainInfoRows(obj);
  if (!rows.length) return null;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" minWidth="260px" maxWidth="360px">
      {rows.slice(0, 4).map(row => (
        row.name === 'Status' ? (
          <Box key={String(row.name)}>{row.value}</Box>
        ) : (
          <StatusLabel status="" key={String(row.name)}>
            {row.name}: {row.value}
          </StatusLabel>
        )
      ))}
    </Box>
  );
}
