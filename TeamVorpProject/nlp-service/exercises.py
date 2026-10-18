# Loads exercises.json

import json
from pathlib import Path

EXERCISES_PATH = Path(__file__).with_name("exercises.json") #Finds exercises.json


def load_exercises(path=EXERCISES_PATH):
    """Read exercises.json and return {exercise id: exercise}."""
    with open(path, encoding="utf-8-sig") as f:
        raw = json.load(f)
    items = raw["Exercises"] if isinstance(raw.get("Exercises"), dict) else raw

    by_id = {}
    for key, exercise in items.items():
        ex_id = exercise["id"] #Keyed by exercises ID e.g. "mackerel-market-cook"
        if ex_id in by_id:
            raise ValueError(f"Duplicate exercise id: {ex_id}")
        by_id[ex_id] = exercise
    return by_id