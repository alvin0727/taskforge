from app.models.workflow import Task 
from typing import List

def generate_tasks_from_prompt(prompt: str) -> List[Task]:
    return [
        Task(
            title="Analyze prompt",
            description="Understand user intent and goal",
            status="todo",
            is_completed=False,
            dependencies=[],
            children=[
                Task(
                    title="Extract key concepts",
                    description="Break down the problem",
                    status="todo",
                    is_completed=False
                ),
                Task(
                    title="Define success criteria",
                    description="Clarify what success looks like",
                    status="todo",
                    is_completed=False
                )
            ]
        ),
        Task(
            title="Create task tree",
            description="Structure subtasks logically",
            status="todo",
            is_completed=False,
            dependencies=[]
        )
    ]
