import os
from pathlib import Path


def configure_tiktoken_offline(cache_dir: str | None = None) -> bool:
    """Configure tiktoken to work offline by pointing to a local cache directory.

    Returns True if the expected encoding files are found locally, False otherwise.
    """
    try:
        if cache_dir is None:
            cache_dir = str(Path(__file__).resolve().parent.parent / "encoding_cache")

        os.makedirs(cache_dir, exist_ok=True)
        os.environ.setdefault("TIKTOKEN_CACHE_DIR", cache_dir)

        # Check for common encodings used by OpenAI models
        required_files = [
            "cl100k_base.tiktoken",  # text-embedding-3-* and GPT-4/3.5
        ]
        present = all((Path(cache_dir) / f).exists() for f in required_files)

        # Try to load once to warm cache, but don't fail hard
        try:
            import tiktoken  # noqa: F401
            # Trigger a local load; this should not hit network if files exist
            _ = tiktoken.get_encoding("cl100k_base")
        except Exception:
            pass

        return present
    except Exception:
        return False
