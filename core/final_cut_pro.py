import json
import os
from pathlib import Path
import opentimelineio as otio


class FinalCutProExporter:
    def __init__(self, fps: int = 60) -> None:
        self.fps = fps

    def build_timeline(self, video_path: str, metadata: dict) -> otio.schema.Timeline:
        # Require precomputed cut points from metadata
        if not isinstance(metadata.get("cutPoints"), list) or len(metadata["cutPoints"]) < 2:
            raise ValueError("metadata.cutPoints missing or invalid. Re-render first so metadata.json includes cutPoints.")

        if not isinstance(metadata.get("fps"), (int, float)) or not int(metadata.get("fps")):
            raise ValueError("metadata.fps missing or invalid. Re-render first.")

        if not isinstance(metadata.get("totalFrames"), (int, float)) or int(metadata.get("totalFrames")) <= 0:
            raise ValueError("metadata.totalFrames missing or invalid. Re-render first.")

        fps = int(metadata["fps"]) or self.fps or 60
        total_frames = int(metadata["totalFrames"]) or 0
        cps = [int(x) for x in metadata["cutPoints"] if isinstance(x, (int, float))]
        cps = sorted(set([cp for cp in cps if 0 <= cp <= total_frames]))
        if cps[-1] != total_frames:
            cps.append(total_frames)
        if cps[0] != 0:
            cps = [0] + cps
        cut_points = cps

        asset_total_frames = total_frames

        timeline = otio.schema.Timeline(name="RenderCode Export")
        track = otio.schema.Track(kind=otio.schema.TrackKind.Video)
        timeline.tracks.append(track)

        media_ref = otio.schema.ExternalReference(
            target_url=Path(os.path.abspath(video_path)).as_uri(),
            available_range=otio.opentime.TimeRange(
                start_time=otio.opentime.RationalTime(0, fps),
                duration=otio.opentime.RationalTime(asset_total_frames, fps),
            ),
        )

        for i in range(len(cut_points) - 1):
            seg_start = cut_points[i]
            seg_end = cut_points[i + 1]
            if seg_end <= seg_start:
                continue
            seg_frames = seg_end - seg_start
            start_time = otio.opentime.RationalTime(seg_start, fps)
            duration = otio.opentime.RationalTime(seg_frames, fps)
            clip = otio.schema.Clip(
                name=os.path.basename(video_path),
                media_reference=media_ref,
                source_range=otio.opentime.TimeRange(start_time=start_time, duration=duration),
            )
            track.append(clip)

        return timeline

    def export_fcpxml(self, timeline: otio.schema.Timeline, out_file: str) -> str:
        otio.adapters.write_to_file(timeline, out_file, adapter_name="fcpx_xml")
        # Patch format to include width/height and normalized name
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(out_file)
            root = tree.getroot()
            resources = root.find("resources")
            fmt = None
            if resources is not None:
                for child in resources:
                    if child.tag == "format":
                        fmt = child
                        break
            if fmt is not None:
                if fmt.get("width") is None:
                    fmt.set("width", "3840")
                if fmt.get("height") is None:
                    fmt.set("height", "2160")
                w = fmt.get("width") or "3840"
                h = fmt.get("height") or "2160"
                fd = fmt.get("frameDuration") or "1/60s"
                try:
                    num, rest = fd.split("/")
                    den = rest.split("s")[0]
                    fps_val = int(den) if int(num) == 1 else int(round(int(den) / int(num)))
                except Exception:
                    fps_val = 60
                fmt.set("name", f"FFVideoFormat{w}x{h}p{fps_val}")
            tree.write(out_file, encoding="utf-8", xml_declaration=True)
        except Exception:
            pass
        return out_file


def export(video_path: str, metadata_path: str, out_path: str | None = None) -> str:
    with open(metadata_path, "r") as f:
        metadata = json.load(f)

    exporter = FinalCutProExporter(fps=int(metadata.get("fps") or 60))
    timeline = exporter.build_timeline(video_path, metadata)

    default_out = os.path.join(os.path.dirname(metadata_path), "render-code.fcpxml")
    out_file = out_path or default_out

    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    return exporter.export_fcpxml(timeline, out_file)


