from typing import List, Dict

def generate_tasks_from_prompt(prompt: str) -> List[Dict]:
    # Dummy static response
    return [
        {
            "id": "task-1",
            "title": "Analyze prompt",
            "description": "Understand user intent and goal",
            "status": "todo",
            "children": [
                {
                    "id": "task-1-1",
                    "title": "Extract key concepts",
                    "description": "Break down the problem",
                    "status": "todo"
                },
                {
                    "id": "task-1-2",
                    "title": "Define success criteria",
                    "description": "Clarify what success looks like",
                    "status": "todo"
                }
            ]
        },
        {
            "id": "task-2",
            "title": "Create task tree",
            "description": "Structure subtasks logically",
            "status": "todo",
        }
    ]