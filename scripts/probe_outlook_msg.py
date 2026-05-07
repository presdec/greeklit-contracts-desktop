import argparse
import json
import multiprocessing as mp
import time
from pathlib import Path
from queue import Empty


def _worker(output_path: str, attachment_path: str | None, queue: mp.Queue, dispatch_mode: str) -> None:
    def report(stage: str) -> None:
        queue.put({"elapsed": round(time.monotonic() - started_at, 3), "stage": stage})

    started_at = time.monotonic()
    try:
        report("import pythoncom/win32com")
        import pythoncom  # type: ignore
        import win32com.client  # type: ignore

        report("CoInitialize")
        pythoncom.CoInitialize()
        try:
            if dispatch_mode in {"active", "auto"}:
                report("GetActiveObject Outlook.Application")
                try:
                    outlook = win32com.client.GetActiveObject("Outlook.Application")
                except Exception:
                    if dispatch_mode == "active":
                        raise
                    report("Dispatch Outlook.Application")
                    outlook = win32com.client.Dispatch("Outlook.Application")
            elif dispatch_mode == "dispatch":
                report("Dispatch Outlook.Application")
                outlook = win32com.client.Dispatch("Outlook.Application")
            elif dispatch_mode == "dispatch-ex":
                report("DispatchEx Outlook.Application")
                outlook = win32com.client.DispatchEx("Outlook.Application")
            else:
                raise ValueError(f"Unsupported dispatch mode: {dispatch_mode}")

            report("CreateItem")
            mail = outlook.CreateItem(0)
            report("set fields")
            mail.Subject = "DocGen Studio MSG probe"
            mail.To = ""
            mail.CC = ""
            mail.HTMLBody = "<p>DocGen Studio MSG probe.</p>"

            if attachment_path:
                report("add attachment")
                mail.Attachments.Add(str(Path(attachment_path).resolve()))

            report("SaveAs")
            mail.SaveAs(str(Path(output_path).resolve()), 9)
            report("saved")
        finally:
            report("CoUninitialize")
            pythoncom.CoUninitialize()
    except Exception as exc:
        queue.put({
            "error": f"{type(exc).__name__}: {exc}",
            "elapsed": round(time.monotonic() - started_at, 3),
        })


def run_probe(
    output_path: Path,
    attachment_path: Path | None,
    timeout_seconds: float,
    dispatch_mode: str,
) -> int:
    queue: mp.Queue = mp.Queue()
    process = mp.Process(
        target=_worker,
        args=(
            str(output_path),
            str(attachment_path) if attachment_path else None,
            queue,
            dispatch_mode,
        ),
    )
    process.start()

    started_at = time.monotonic()
    events = []
    while process.is_alive():
        try:
            while True:
                event = queue.get_nowait()
                events.append(event)
                print(json.dumps(event, ensure_ascii=False), flush=True)
        except Empty:
            pass

        if time.monotonic() - started_at > timeout_seconds:
            process.terminate()
            process.join(5)
            timeout_event = {
                "error": f"Timed out after {timeout_seconds:g}s",
                "lastStage": events[-1].get("stage") if events else None,
            }
            print(json.dumps(timeout_event, ensure_ascii=False), flush=True)
            return 124

        time.sleep(0.1)

    process.join()
    try:
        while True:
            event = queue.get_nowait()
            events.append(event)
            print(json.dumps(event, ensure_ascii=False), flush=True)
    except Empty:
        pass

    if process.exitcode not in (0, None):
        print(json.dumps({"error": f"Worker exited with code {process.exitcode}"}, ensure_ascii=False), flush=True)
        return process.exitcode or 1

    if any("error" in event for event in events):
        return 1

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Probe Outlook MSG creation independently of the generator.")
    parser.add_argument("--output", default=".tmp/outlook-msg-probe/probe.msg")
    parser.add_argument("--attachment")
    parser.add_argument("--dispatch-mode", choices=["active", "auto", "dispatch", "dispatch-ex"], default="auto")
    parser.add_argument("--timeout", default=20.0, type=float)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    attachment_path = Path(args.attachment) if args.attachment else None
    return run_probe(output_path, attachment_path, args.timeout, args.dispatch_mode)


if __name__ == "__main__":
    raise SystemExit(main())
