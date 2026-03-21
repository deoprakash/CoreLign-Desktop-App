import os
import json
import time
from threading import Lock
from collections import deque

LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
LOG_DIR = os.path.abspath(LOG_DIR)
os.makedirs(LOG_DIR, exist_ok=True)
METRICS_LOG = os.path.join(LOG_DIR, "metrics.log")


class MetricsRecorder:
    def __init__(self, logfile: str = METRICS_LOG, window_seconds: int = 60):
        self.logfile = logfile
        self.lock = Lock()
        # store timestamps (epoch seconds) of recent queries for throughput calc
        self.timestamps = deque()
        self.window_seconds = window_seconds

    def _now(self):
        return time.time()

    def record(self, *,
               query: str,
               top_k: int,
               response_time: float,
               retrieval_time: float,
               generation_time: float,
               status: str = "ok",
               extra: dict = None):
        """Record a single query metrics entry.

        Times are in seconds (float).
        Writes a JSON line to the logfile.
        """
        ts = self._now()
        entry = {
            "timestamp": ts,
            "query": query if query is None or len(query) <= 256 else query[:256],
            "top_k": top_k,
            "response_time": round(response_time, 6),
            "retrieval_time": round(retrieval_time, 6),
            "generation_time": round(generation_time, 6),
            "status": status,
            "throughput_qps": round(self.throughput(), 3),
        }
        if extra:
            entry.update(extra)

        line = json.dumps(entry, ensure_ascii=False)

        with self.lock:
            # append timestamp for throughput
            self.timestamps.append(ts)
            # purge old timestamps outside window
            self._purge_old()
            with open(self.logfile, "a", encoding="utf-8") as fh:
                fh.write(line + "\n")

    def _purge_old(self):
        cutoff = self._now() - self.window_seconds
        while self.timestamps and self.timestamps[0] < cutoff:
            self.timestamps.popleft()

    def throughput(self, window_seconds: int = None) -> float:
        """Return queries per second over the configured window (or provided).
        """
        if window_seconds is None:
            window_seconds = self.window_seconds
        self._purge_old()
        count = len(self.timestamps)
        if window_seconds <= 0:
            return float(count)
        return count / window_seconds


metrics = MetricsRecorder()
