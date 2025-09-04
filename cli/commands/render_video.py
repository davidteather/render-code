import os
import shutil
import subprocess
from pathlib import Path


def _copy_into(src: Path, dest_dir: Path) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        # Copy directory contents into dest_dir
        for item in src.iterdir():
            target = dest_dir / item.name
            if item.is_dir():
                if target.exists():
                    shutil.rmtree(target)
                shutil.copytree(item, target)
            else:
                shutil.copy2(item, target)
    else:
        shutil.copy2(src, dest_dir / src.name)


def main(args):
    file_path = Path(args.file).expanduser().resolve()
    print(f"Rendering video with {file_path} using Remotion...")

    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"Markdown file not found: {file_path}")

    repo_root = Path(__file__).resolve().parents[2]
    remotion_dir = repo_root / "remotion"
    public_dir = remotion_dir / "public"
    public_dir.mkdir(parents=True, exist_ok=True)

    # Copy markdown into remotion/public as input.md
    input_md = public_dir / "input.md"
    shutil.copyfile(file_path, input_md)

    # Run remotion render with MARKDOWN_FILE set
    env = os.environ.copy()
    env["MARKDOWN_FILE"] = "input.md"

    # Prefer keeping the existing render behavior; run from remotion dir
    # Assumes composition and output are configured by Remotion project
    subprocess.run(
        ["npx", "remotion", "render"],
        cwd=str(remotion_dir),
        env=env,
        check=True,
    )

    # Copy outputs into <md-folder>/out
    out_dir = file_path.with_suffix("") / "out"
    remotion_out = remotion_dir / "out"
    if not remotion_out.exists():
        raise RuntimeError(f"Expected Remotion output folder not found: {remotion_out}")

    _copy_into(remotion_out, out_dir)

