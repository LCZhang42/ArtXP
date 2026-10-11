import json
import sys
from pathlib import Path

from app.main import app


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/export_openapi.py OUTPUT_PATH")
    output_path = Path(sys.argv[1]).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()