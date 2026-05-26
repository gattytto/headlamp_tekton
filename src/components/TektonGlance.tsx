// SPDX-License-Identifier: EPL-2.0

import Box from '@mui/material/Box';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { mainInfoRows } from '../pages/detailHelpers';

const kind = (obj: any) => obj?.kind || obj?.jsonData?.kind;
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
  if (tektonKinds.includes(kind(node?.kubeObject))) return node.kubeObject;
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
