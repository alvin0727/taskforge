from app.utils.const_value import TaskStatus

def validate_task_status(status: str):
    if status not in [e.value for e in TaskStatus]:
        raise ValueError(f"Invalid status: {status}")