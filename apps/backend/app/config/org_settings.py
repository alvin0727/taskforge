from copy import deepcopy

DEFAULT_ORG_SETTINGS = {
    "timezone": "UTC",
    "features": {
        "time_tracking": True,
        "public_projects": False,
        "file_uploads": True,
        "integrations": False,
        "client_access": False,
        "member_invitations": False
    },
    "permissions": {
        "who_can_create_projects": "admin_and_managers",
        "who_can_invite_members": "admin_only"
    }
}


def get_org_settings(org_type: str = "personal") -> dict:
    settings = deepcopy(DEFAULT_ORG_SETTINGS)
    settings["type"] = org_type
    if org_type == "team":
        settings["features"]["client_access"] = True
        settings["features"]["member_invitations"] = True
    return settings
