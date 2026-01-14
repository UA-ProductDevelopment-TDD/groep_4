todo_schema = {
    "name": "Todo",
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
            "description": "Title of the to-do"
        },
        "description": {
            "type": "string",
            "description": "Detailed description"
        },
        "status": {
            "type": "string",
            "enum": [
                "active",
                "in_progress",
                "completed"
            ],
            "default": "active",
            "description": "Current status of the to-do"
        },
        "time_spent": {
            "type": "number",
            "default": 0,
            "description": "Total time spent in seconds"
        },
        "started_at": {
            "type": "string",
            "description": "When the timer was last started"
        },
        "completed_at": {
            "type": "string",
            "description": "When the to-do was completed"
        },
        "is_timer_running": {
            "type": "boolean",
            "default": False,  # let op: in Python is het False, niet false
            "description": "Whether the timer is currently running"
        }
    },
    "required": [
        "title"
    ]
}

print(todo_schema["name"])
