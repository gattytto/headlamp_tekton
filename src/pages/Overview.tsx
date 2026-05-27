// SPDX-License-Identifier: EPL-2.0
// headlamp_tekton/src/pages/Overview.tsx

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Icon } from '@iconify/react';

import { PipelineClass } from '../crd/pipeline';
import { PipelineRunClass } from '../crd/pipelinerun';
import { TaskClass } from '../crd/task';
import { TaskRunClass } from '../crd/taskrun';
import { TriggerBindingClass } from '../crd/trigger';
import { TriggerTemplateClass } from '../crd/triggertemplate';
import { EventListenerClass } from '../crd/eventlistener';
import { ClusterInterceptorClass } from '../crd/clusterinterceptor';

export function OverviewPage() {
  const [pipelines] = PipelineClass.useList();
  const [pipelineRuns] = PipelineRunClass.useList();
  const [tasks] = TaskClass.useList();
  const [taskRuns] = TaskRunClass.useList();
  const [bindings] = TriggerBindingClass.useList();
  const [templates] = TriggerTemplateClass.useList();
  const [listeners] = EventListenerClass.useList();
  const [interceptors] = ClusterInterceptorClass.useList();

  const stat = (label: string, value?: number) => (
    <Grid item xs={12} md={3}>
      <SectionBox>
        <Typography variant="h6">{label}</Typography>
        <Typography variant="h4">{value ?? '-'}</Typography>
      </SectionBox>
    </Grid>
  );

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Icon icon="custom:tekton" width={48} height={48} />
        <Typography variant="h5" style={{ marginLeft: 10 }}>
          Tekton Resources Overview
        </Typography>
      </div>

      {/* Stats */}
      <Grid container spacing={2}>
        {stat('Pipelines', pipelines?.length)}
        {stat('PipelineRuns', pipelineRuns?.length)}
        {stat('Tasks', tasks?.length)}
        {stat('TaskRuns', taskRuns?.length)}
        {stat('TriggerBindings', bindings?.length)}
        {stat('TriggerTemplates', templates?.length)}
        {stat('EventListeners', listeners?.length)}
        {stat('ClusterInterceptors', interceptors?.length)}
      </Grid>

      {/* Info Sections */}
      <Grid container spacing={2} style={{ marginTop: 10 }}>
        <Grid item xs={12} md={6}>
          <SectionBox title="Pipelines">
            <Typography variant="body2">
              Declarative CI/CD pipelines composed of tasks.
            </Typography>
          </SectionBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionBox title="PipelineRuns">
            <Typography variant="body2">
              Executions of pipelines.
            </Typography>
          </SectionBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionBox title="Tasks & TaskRuns">
            <Typography variant="body2">
              Individual build steps and their executions.
            </Typography>
          </SectionBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionBox title="Triggers">
            <Typography variant="body2">
              Event-driven automation via bindings, templates and listeners.
            </Typography>
          </SectionBox>
        </Grid>
      </Grid>
    </div>
  );
}
