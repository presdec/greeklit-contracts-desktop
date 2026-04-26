import argparse
import json
import platform
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


RUNTIME_TARGETS = {
    "generate_contracts": {
        "script": ("scripts", "generate_contracts.py"),
    },
    "generate_email_drafts": {
        "script": ("scripts", "generate_email_drafts.py"),
    },
    "inspect_project": {
        "script": ("scripts", "inspect_project.py"),
    },
}


def node_platform_key() -> str:
    system = sys.platform
    if system.startswith("win"):
        os_key = "win32"
    elif system == "darwin":
        os_key = "darwin"
    elif system.startswith("linux"):
        os_key = "linux"
    else:
        os_key = system

    machine = platform.machine().lower()
    if machine in {"amd64", "x86_64"}:
        arch_key = "x64"
    elif machine in {"aarch64", "arm64"}:
        arch_key = "arm64"
    elif machine in {"i386", "i686", "x86"}:
        arch_key = "ia32"
    else:
        arch_key = machine

    return f"{os_key}-{arch_key}"


def executable_name(base_name: str) -> str:
    return f"{base_name}.exe" if sys.platform.startswith("win") else base_name


def ensure_pyinstaller() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "PyInstaller", "--version"],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit(
            "PyInstaller is required to build packaged runtime executables. "
            "Install it in the active Python environment with: python -m pip install pyinstaller"
        )


def run_pyinstaller(
    app_dir: Path,
    workspace_root: Path,
    output_dir: Path,
    build_dir: Path,
    spec_dir: Path,
    name: str,
    script_parts: tuple[str, ...],
) -> Path:
    script_path = (app_dir / Path(*script_parts)).resolve()
    if not script_path.exists():
        script_path = (workspace_root / Path(*script_parts)).resolve()
    if not script_path.exists():
        raise FileNotFoundError(f"Runtime source script not found for {name}: {script_path}")

    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--clean",
        "--onefile",
        "--noconfirm",
        "--name",
        name,
        "--distpath",
        str(output_dir),
        "--workpath",
        str(build_dir / name),
        "--specpath",
        str(spec_dir),
        str(script_path),
    ]
    subprocess.run(command, cwd=workspace_root, check=True)

    built_path = output_dir / executable_name(name)
    if not built_path.exists():
        raise FileNotFoundError(f"PyInstaller finished but did not create {built_path}")
    return built_path


def write_manifest(output_dir: Path, built_paths: list[Path]) -> None:
    manifest = {
        "arch": platform.machine(),
        "builtAt": datetime.now(timezone.utc).isoformat(),
        "executables": [path.name for path in built_paths],
        "platform": sys.platform,
        "runtimeKey": output_dir.name,
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build platform-specific Greeklit runtime executables with PyInstaller.",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Remove the platform runtime output directory before building.",
    )
    return parser.parse_args()


def prune_other_runtime_dirs(runtime_root: Path, active_runtime_key: str) -> None:
    if not runtime_root.exists():
        return

    for child in runtime_root.iterdir():
        if child.name == ".gitignore":
            continue
        if child.is_dir() and child.name != active_runtime_key:
            shutil.rmtree(child, ignore_errors=True)


def main() -> int:
    args = parse_args()
    app_dir = Path(__file__).resolve().parents[1]
    workspace_root = app_dir.parent
    runtime_key = node_platform_key()
    runtime_root = app_dir / "runtime"
    output_dir = runtime_root / runtime_key
    build_dir = app_dir / ".runtime-build" / runtime_key
    spec_dir = build_dir / "spec"

    ensure_pyinstaller()
    prune_other_runtime_dirs(runtime_root, runtime_key)

    if args.clean and output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    spec_dir.mkdir(parents=True, exist_ok=True)

    built_paths = []
    for name, target in RUNTIME_TARGETS.items():
        built_paths.append(
            run_pyinstaller(
                app_dir,
                workspace_root,
                output_dir,
                build_dir,
                spec_dir,
                name,
                target["script"],
            )
        )

    write_manifest(output_dir, built_paths)
    print(f"Built runtime executables in {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
