import os
from datetime import datetime, timezone
from fastapi import APIRouter, Request

router = APIRouter()


def _get_memory_mb():
    try:
        with open("/proc/self/status") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    return int(line.split()[1]) / 1024
    except Exception:
        return None


@router.get("/detailed")
async def health_detailed(request: Request):
    metrics = getattr(request.app.state, "metrics", {})
    start_time = getattr(request.app.state, "start_time", datetime.now(timezone.utc))
    uptime_seconds = (datetime.now(timezone.utc) - start_time).total_seconds()

    system = {
        "uptime_seconds": uptime_seconds,
        "load_average": list(os.getloadavg()) if hasattr(os, "getloadavg") else None,
        "memory_rss_mb": _get_memory_mb(),
    }

    return {
        "status": "ok",
        "system": system,
        "requests": {
            "total": metrics.get("total_requests", 0),
            "by_endpoint": metrics.get("by_endpoint", {}),
        },
    }
