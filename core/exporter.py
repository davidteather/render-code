from __future__ import annotations

from typing import Optional

from core.final_cut_pro import export as export_fcpx
from core.premiere_pro import export as export_premiere


class NLEExporter:
    def cut(self, video_file: str, metadata_file: str, out_path: Optional[str] = None) -> Optional[str]:
        raise NotImplementedError

    def process(self, *args, **kwargs) -> Optional[str]:
        return self.cut(*args, **kwargs)


class FinalCutProExporter(NLEExporter):
    def cut(self, video_file: str, metadata_file: str, out_path: Optional[str] = None) -> Optional[str]:
        return export_fcpx(video_file, metadata_file, out_path)


class PremiereProExporter(NLEExporter):
    def cut(self, video_file: str, metadata_file: str, out_path: Optional[str] = None) -> Optional[str]:
        export_premiere(video_file, metadata_file)
        return None


def get_exporter(kind: str) -> NLEExporter:
    k = (kind or "").lower()
    if k in ("final-cut", "fcpx", "fcp"):
        return FinalCutProExporter()
    return PremiereProExporter()


