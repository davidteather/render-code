import os

def main(args):
    file_path = args.file
    print(f"Rendering video with {file_path} using Remotion...")

    # need to copy md into the remotion/public folder so it can access it
    os.system(f"cp {file_path} remotion/public/input.md")

    os.system("cd remotion && npx remotion render")

    folder_path = file_path[:-3]
    os.makedirs(f"{folder_path}/out", exist_ok=True)

    os.system(f"cp -rf remotion/out/* {folder_path}/out")

