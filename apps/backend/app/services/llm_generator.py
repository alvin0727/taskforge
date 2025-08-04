from app.models.task import Task
from typing import List
from bson import ObjectId

def generate_dummy_tasks(project_id: str, board_id: str, num_root: int = 10) -> List[dict]:
    tasks = []
    # 5 backlog
    for i in range(5):
        task = Task(
            title=f"Backlog Task {i+1}",
            description=f"Description for backlog task {i+1}",
            status="backlog",
            priority="medium",
            project_id=ObjectId(project_id),
            board_id=ObjectId(board_id),
            column_id="backlog",
            creator_id=ObjectId(),
            assignee_id=None,
            reviewers=[],
            due_date=None,
            start_date=None,
            completed_at=None,
            estimated_hours=None,
            actual_hours=None,
            labels=[],
            attachments=[],
            comments=[],
            time_logs=[],
            dependencies=[],
            position=float(i),
            archived=False
        )
        tasks.append(task)
    # 5 todo
    for i in range(5):
        task = Task(
            title=f"Todo Task {i+1}",
            description=f"Description for todo task {i+1}",
            status="todo",
            priority="medium",
            project_id=ObjectId(project_id),
            board_id=ObjectId(board_id),
            column_id="todo",
            creator_id=ObjectId(),
            assignee_id=None,
            reviewers=[],
            due_date=None,
            start_date=None,
            completed_at=None,
            estimated_hours=None,
            actual_hours=None,
            labels=[],
            attachments=[],
            comments=[],
            time_logs=[],
            dependencies=[],
            position=float(i + 5),
            archived=False
        )
        tasks.append(task)
    return [t.model_dump(by_alias=True) for t in tasks]