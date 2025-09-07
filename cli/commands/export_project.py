
from core.exporter import get_exporter

def main(args):
    file_path = args.file
    format_choice = getattr(args, "format", "premiere")
    is_preview = bool(getattr(args, "preview", False))

    folder_path = file_path[:-3]
    comp = "MyCompPreview" if is_preview else "MyComp"
    video_file = f"{folder_path}/out/{comp}.mp4"
    metadata_file = f"{folder_path}/out/{comp}/metadata.json"

    print(f"Exporting project from {file_path} to {format_choice}...")
    exporter = get_exporter(format_choice)
    out_file = exporter.cut(video_file, metadata_file)
    if out_file:
        print(f"Wrote: {out_file}")