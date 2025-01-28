import time
import pymiere
from pymiere import wrappers
import json
import os


def export(video_path, metadata_path):
    with open(metadata_path, "r") as f:
        metadata = json.load(f)

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
    segment_numbers = len(metadata["blocks"])

    segment_blocks = metadata["blocks"]
    additional_frames = metadata["extraFramesPerBlock"]
    for i in range(segment_numbers + 1):
        if i == segment_numbers:
            timecode = wrappers.timecode_from_seconds((i * frames_per_segment) * fps.seconds, seq)
            pymiere.objects.qe.project.getActiveSequence().getVideoTrackAt(0).razor(timecode)
            break

        frames_per_segment = (segment_blocks[i]["duration"] + additional_frames) * 2

        diff_cuts = [1, 3]
        for diff in diff_cuts:
            timecode = wrappers.timecode_from_seconds(((i * frames_per_segment) + diff) * fps.seconds, seq)

            #timecode = wrappers.timecode_from_seconds(i * frames_per_segment / fps + diff, seq)
            pymiere.objects.qe.project.getActiveSequence().getVideoTrackAt(0).razor(timecode)