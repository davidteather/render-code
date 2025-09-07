import time
import pymiere
from pymiere import wrappers
import json
import os


def export(video_path, metadata_path):
    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    # Validate required metadata fields
    if not isinstance(metadata.get("cutPoints"), list) or len(metadata["cutPoints"]) < 2:
        raise ValueError("metadata.cutPoints missing or invalid. Re-render first so metadata.json includes cutPoints.")
    if not isinstance(metadata.get("fps"), (int, float)) or not int(metadata.get("fps")):
        raise ValueError("metadata.fps missing or invalid. Re-render first.")

    project_opened, sequence_active = wrappers.check_active_sequence(crash=False)
    if not project_opened:
        raise ValueError("please open a project")

    project = pymiere.objects.app.project

    # Open Sequences in Premiere Pro if none are active
    if not sequence_active:
        sequences = wrappers.list_sequences()

        if not sequences:
            raise ValueError("No sequences found in the project")

        for seq in sequences:
            project.openSequence(sequenceID=seq.sequenceID)
        # Set the first Sequence in the list as the active Sequence
        project.activeSequence = sequences[0]


    # Add a video clip to the sequence
    video_path = os.path.abspath(video_path)

    r = project.importFiles([video_path], suppressUI=True, targetBin=project.getInsertionBin(), importAsNumberedStills=False)
    items = project.rootItem.findItemsMatchingMediaPath(video_path, ignoreSubclips=False)  
    project.activeSequence.videoTracks[0].insertClip(items[0], wrappers.time_from_seconds(0))

    seq = pymiere.objects.app.project.activeSequence

    fps = seq.getSettings().videoFrameRate


    # frames_per_segment = metadata[''] # 20 + 30
    #frames_per_segment = 100
    cut_points = [int(x) for x in metadata["cutPoints"] if isinstance(x, (int, float))]
    cut_points = sorted(set([cp for cp in cut_points if cp >= 0]))
    # Convert frame indices to seconds using FPS
    for cp in cut_points:
        seconds = cp / fps.seconds
        timecode = wrappers.timecode_from_seconds(seconds, seq)
        pymiere.objects.qe.project.getActiveSequence().getVideoTrackAt(0).razor(timecode)