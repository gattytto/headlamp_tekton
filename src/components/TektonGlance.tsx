// SPDX-License-Identifier: EPL-2.0

import Box from '@mui/material/Box';
import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { mainInfoRows } from '../pages/detailHelpers';

const kind = (obj: any) => obj?.kind || obj?.jsonData?.kind;

export function TektonGlance({ node }: { node: any }) {
  const obj = node.kubeObject;

  if (
    ![
      'Pipeline',
      'PipelineRun',
      'Task',
      'TaskRun',
      'TriggerBinding',
      'TriggerTemplate',
      'EventListener',
      'ClusterInterceptor',
    ].includes(kind(obj))
  ) {
    return null;
  }

  const rows = mainInfoRows(obj);
  if (!rows.length) return null;

  return (
    <Box mt={1}>
      <NameValueTable rows={rows.slice(0, 4)} />
    </Box>
  );
}
