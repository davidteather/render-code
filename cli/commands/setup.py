import os
import subprocess
from pathlib import Path

def main(args):
    print("Setting up the project")

    print("Installing dependencies (npm ci) in remotion/")
    repo_root = Path(__file__).resolve().parents[2]
    remotion_dir = repo_root / "remotion"
    env = os.environ.copy()
    try:
        subprocess.run(["npm", "ci"], cwd=str(remotion_dir), env=env, check=True)
    except Exception:
        # Fallback to npm install for dev environments where lockfile may be out of date
        subprocess.run(["npm", "install"], cwd=str(remotion_dir), env=env, check=True)
