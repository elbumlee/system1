from storage.base import AbstractStorage
from storage import create_storage

_storage: AbstractStorage | None = None


def get_storage() -> AbstractStorage:
    global _storage
    if _storage is None:
        _storage = create_storage()
    return _storage


def reset_storage(new_storage: AbstractStorage) -> None:
    global _storage
    _storage = new_storage
