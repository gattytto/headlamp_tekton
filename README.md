# <img width="100" height="100" src="src/favicon.svg"> Headlamp Tekton Plugin

This Headlamp plugin adds Tekton-focused resource views, run actions, and graph-map support for Tekton Pipelines and Triggers resources. It is built for inspecting the path from trigger inputs to pipeline definitions, task execution, and runtime results.

## Resources

The plugin registers list, detail, map-detail, glance, icon, and graph-map support for Tekton resources including:

```text
Pipeline
PipelineRun
Task
TaskRun
EventListener
Trigger
TriggerBinding
TriggerTemplate
ClusterInterceptor
```

## Map Behavior

The map source owns Tekton factory and runtime nodes. It connects trigger resources to pipeline factories, pipeline factories to task definitions, task definitions to task runs, and task runs to pipeline runs when Tekton ownership and label propagation expose that relation.

The plugin can detect Calico policy-mediated runtime edges without directly depending on the Calico plugin. When Calico is present, Tekton suppresses only the direct `TaskRun` to `PipelineRun` edge that would duplicate an existing policy-mediated path. When no policy connector is selected, Tekton keeps the direct runtime edge so pipeline runs stay connected.

## Actions

TaskRun and PipelineRun views expose runtime actions such as rerun and cancellation where the current resource state supports them. These actions are available from the list pages and details surfaces so active runs can be inspected and controlled without leaving the Tekton view.

## Interoperability

Tekton and Calico intentionally use a loose graph interop model. They publish and read graph runtime signals instead of importing each other directly. That lets the plugins cooperate in the map when both are enabled while remaining independently usable.

Concolor can add policy-profile context on top of Tekton factories and runtime objects, but Tekton remains the source that renders Tekton resources.
