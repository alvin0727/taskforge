from app.models.task import Task
from typing import List


def generate_tasks_from_prompt(prompt: str, workflow_id: str) -> List[dict]:
    root1 = Task(
        workflow_id=workflow_id,
        title="Analyze prompt",
        description="Understand user intent and goal",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=0,
        parent_id=None
    )
    sub1 = Task(
        workflow_id=workflow_id,
        title="Extract key concepts",
        description="Break down the problem",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=0,
        parent_id=root1.id
    )
    sub2 = Task(
        workflow_id=workflow_id,
        title="Define success criteria",
        description="Clarify what success looks like",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=1,
        parent_id=root1.id
    )
    root2 = Task(
        workflow_id=workflow_id,
        title="Create task tree",
        description="Structure subtasks logically",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=1,
        parent_id=None
    )
    return [t.model_dump(by_alias=True) for t in [root1, sub1, sub2, root2]]


def generate_dummy_tasks(workflow_id: str, num_root: int = 10, num_sub: int = 2) -> List[dict]:
    tasks = []
    for i in range(num_root):
        root = Task(
            workflow_id=workflow_id,
            title=f"Root Task {i+1}",
            description=f"Description for root task {i+1}",
            status="todo",
            is_completed=False,
            dependencies=[],
            order=i,
            parent_id=None
        )
        tasks.append(root)
        for j in range(num_sub):
            sub = Task(
                workflow_id=workflow_id,
                title=f"Subtask {j+1} of Root {i+1}",
                description=f"Description for subtask {j+1} of root {i+1}",
                status="todo",
                is_completed=False,
                dependencies=[],
                order=j,
                parent_id=str(root.id)
            )
            tasks.append(sub)
    return [t.model_dump(by_alias=True) for t in tasks]
