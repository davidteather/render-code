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
        # Prefer totalFrames (full timeline) + safety; fallback to last-block + holds; then extraFramesPerBlock
        end_frames = 0
        total_frames = int(metadata.get("totalFrames", 0))
        if total_frames > 0:
            end_frames = total_frames + trim_safety
        elif blocks:
            last = blocks[-1]
            highlight_holds = metadata.get("perBlockHighlightHoldFrames", [])
            tail_holds = metadata.get("perBlockTailFrames", [])
            if (
                isinstance(highlight_holds, list)
                and isinstance(tail_holds, list)
                and len(highlight_holds) == len(blocks) == len(tail_holds)
            ):
                end_frames = (
                    int(last.get("start", 0))
                    + int(last.get("duration", 0))
                    + int(highlight_holds[-1])
                    + int(tail_holds[-1])
                    + trim_safety
                )
            else:
                extra_frames = int(metadata.get("extraFramesPerBlock", 0))
                end_frames = int(last.get("start", 0)) + int(last.get("duration", 0)) + extra_frames + trim_safety
        else:
            return

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

    # Decide markdown target filename in public
    target_name = args.markdown_file if getattr(args, 'markdown_file', None) else "input.md"
    input_md = public_dir / target_name
    shutil.copyfile(file_path, input_md)

    # Ensure assets are available in public for cutaways (repo assets, then project assets override)
    repo_assets = repo_root / "assets"
    if repo_assets.exists() and repo_assets.is_dir():
        _copy_into(repo_assets, public_dir / "assets")
    project_assets = file_path.parent / "assets"
    if project_assets.exists() and project_assets.is_dir():
        _copy_into(project_assets, public_dir / "assets")

    # Run remotion render with props + env to convey markdown file name
    env = os.environ.copy()
    # Enforce fail-fast parse; do not support skip warnings via CLI
    # Also expose for legacy env-based consumers (harmless if unused in app)
    env['MARKDOWN_FILE'] = target_name

    # Render preview-only if --preview set; otherwise render both main and preview for convenience
    comp_ids = ["MyCompPreview"] if getattr(args, 'preview', False) else ["MyComp", "MyCompPreview"]
    # Resolve project settings precedence: CLI > <mdDir>/settings.json > repo_root/settings.json
    props_user_settings = None
    settings_path = getattr(args, 'settings', None)
    if settings_path:
        try:
            with open(settings_path, 'r') as sf:
                props_user_settings = json.load(sf)
        except Exception as e:
            print(f"Warning: Could not read settings file {settings_path}: {e}")
    else:
        try:
            md_dir = file_path.parent
            md_settings = md_dir / 'settings.json'
            if md_settings.exists():
                with md_settings.open('r') as sf:
                    props_user_settings = json.load(sf)
            elif (repo_root / 'settings.json').exists():
                with (repo_root / 'settings.json').open('r') as sf:
                    props_user_settings = json.load(sf)
        except Exception as e:
            print(f"Warning: Could not read project settings.json: {e}")

    for comp_id in comp_ids:
        # Pass markdownFile and optional settings as Remotion props
        props_obj = {"markdownFile": target_name}
        if props_user_settings is not None:
            props_obj['userSettings'] = props_user_settings
        
        props = json.dumps(props_obj)
        cmd = ["npx", "remotion", "render", comp_id, "--props", props]
        subprocess.run(
            cmd,
            cwd=str(remotion_dir),
            env=env,
            check=True,
        )

    # Trim trailing blank space using metadata (skip in preview for safety)
    remotion_out = remotion_dir / "out"
    if not getattr(args, 'preview', False):
        _trim_video_if_possible(remotion_out, default_fps=30)

    # Copy outputs into <md-folder>/out
    out_dir = file_path.with_suffix("") / "out"
    if not remotion_out.exists():
        raise RuntimeError(f"Expected Remotion output folder not found: {remotion_out}")

    _copy_into(remotion_out, out_dir)

