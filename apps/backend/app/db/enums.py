from enum import Enum

class TaskStatus(str, Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    CANCELED = "canceled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on-hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"
    VIEWER = "viewer"

class ActivityType(str, Enum):
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_ASSIGNED = "task_assigned"
    TASK_COMMENTED = "task_commented"
    PROJECT_CREATED = "project_created"
    PROJECT_UPDATED = "project_updated"
    USER_JOINED = "user_joined"
    FILE_UPLOADED = "file_uploaded"
    BOARD_UPDATED = "board_updated"
    
class NotificationType(str, Enum):
    TASK_ASSIGNED = "task_assigned"
    TASK_DUE = "task_due"
    TASK_OVERDUE = "task_overdue"
    MENTION = "mention"
    PROJECT_UPDATE = "project_update"
    DEADLINE_REMINDER = "deadline_reminder"
    COMMENT_REPLY = "comment_reply"

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    REVOKED = "revoked"