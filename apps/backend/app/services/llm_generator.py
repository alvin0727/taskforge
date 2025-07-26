from app.models.workflow import Task 
from typing import List

def generate_tasks_from_prompt(prompt: str) -> List[dict]:
    # Flat structure: all tasks and subtasks in one list, use parent_id to relate
    root1 = Task(
        title="Analyze prompt",
        description="Understand user intent and goal",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=0,
        parent_id=None
    )
    sub1 = Task(
        title="Extract key concepts",
        description="Break down the problem",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=0,
        parent_id=root1.id
    )
    sub2 = Task(
        title="Define success criteria",
        description="Clarify what success looks like",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=1,
        parent_id=root1.id
    )
    root2 = Task(
        title="Create task tree",
        description="Structure subtasks logically",
        status="todo",
        is_completed=False,
        dependencies=[],
        order=1,
        parent_id=None
    )
    # Return as list of dict (JSON serializable)
    return [t.model_dump(by_alias=True) for t in [root1, sub1, sub2, root2]]
