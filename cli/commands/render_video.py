import os
import shutil
import subprocess
from pathlib import Path
import json


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


def _trim_video_if_possible(remotion_out: Path, default_fps: int = 30) -> None:
    """Trim the output MP4 to the actual content length based on metadata.json.

    Expects structure:
      remotion/out/MyComp.mp4
      remotion/out/MyComp/metadata.json
    """
    try:
        mp4_candidates = list(remotion_out.glob("*.mp4"))
        if not mp4_candidates:
            return
        video_path = mp4_candidates[0]
        comp_name = video_path.stem
        metadata_path = remotion_out / comp_name / "metadata.json"
        if not metadata_path.exists():
            return

        with metadata_path.open("r") as f:
            metadata = json.load(f)

        blocks = metadata.get("blocks", [])
        trim_safety = int(metadata.get("trimSafetyFrames", 0))
        fps = int(metadata.get("fps", default_fps)) or default_fps
        # Prefer totalFrames (end of last animation) + small safety to avoid overestimation from per-block tails
        total_frames = int(metadata.get("totalFrames", 0))
        if total_frames > 0:
            end_frames = total_frames + trim_safety
        else:
            if not blocks:
                return
            extra_frames = int(metadata.get("extraFramesPerBlock", 0))
            last = blocks[-1]
            end_frames = int(last.get("start", 0)) + int(last.get("duration", 0)) + extra_frames + trim_safety

        # Prepare trim command
        duration_seconds = max(end_frames / float(fps), 0.0)
        if duration_seconds <= 0:
            return

        trimmed = video_path.with_name(f"{comp_name}.trimmed.mp4")
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-t",
            f"{duration_seconds:.3f}",
            "-c",
            "copy",
            str(trimmed),
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Replace original
        shutil.move(str(trimmed), str(video_path))
    except Exception as exc:
        # Non-fatal: skip trimming if ffmpeg or metadata not available
        print(f"Warning: skipping trim ({exc})")


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

    subprocess.run(
        ["npx", "remotion", "render"],
        cwd=str(remotion_dir),
        env=env,
        check=True,
    )

    # Trim trailing blank space using metadata
    remotion_out = remotion_dir / "out"
    _trim_video_if_possible(remotion_out, default_fps=30)

    # Copy outputs into <md-folder>/out
    out_dir = file_path.with_suffix("") / "out"
    if not remotion_out.exists():
        raise RuntimeError(f"Expected Remotion output folder not found: {remotion_out}")

    _copy_into(remotion_out, out_dir)

