
from core.premiere_pro import export

def main(args):
    file_path = args.file
    print(f"Exporting project from {file_path} to Premiere Pro...")

    folder_path = file_path[:-3]

    video_file = f"{folder_path}/out/MyComp.mp4"
    metadata_file = f"{folder_path}/out/MyComp/metadata.json"

    export(video_file, metadata_file)