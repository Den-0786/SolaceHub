import logging

from django.conf import settings
from django.core.files.storage import FileSystemStorage

logger = logging.getLogger(__name__)


class FallbackS3Storage(FileSystemStorage):
    """S3-first storage that falls back to the local filesystem.

    Writes try S3 first and fall back to MEDIA_ROOT when S3 is unreachable or
    misconfigured. Reads and URLs prefer the local copy so a file that was
    stored locally always resolves to a working local URL.
    """

    def __init__(self, *args, **kwargs):
        from storages.backends.s3boto3 import S3Boto3Storage

        self.s3 = S3Boto3Storage(*args, **kwargs)
        super().__init__(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)

    def _save(self, name, content):
        try:
            return self.s3._save(name, content)
        except Exception:
            logger.exception("S3 save failed for %s, falling back to local storage", name)
            try:
                content.seek(0)
            except Exception:
                pass
            return super()._save(name, content)

    def _open(self, name, mode='rb'):
        if super().exists(name):
            return super()._open(name, mode)
        try:
            return self.s3._open(name, mode)
        except Exception:
            logger.warning("S3 open failed for %s, falling back to local storage", name)
            return super()._open(name, mode)

    def exists(self, name):
        if super().exists(name):
            return True
        try:
            return self.s3.exists(name)
        except Exception:
            return False

    def url(self, name):
        # S3 url() below signs or builds a URL locally, so no network HEAD is
        # needed here. The previous s3.exists() check hit S3 on every call,
        # which made list serializations that embed media URLs (e.g. a
        # deceased_image on hundreds of donation rows) wait one round trip per
        # row and time out the request.
        try:
            if super().exists(name):
                return super().url(name)
        except Exception:
            logger.warning("Local url failed for %s, using S3 url", name)
        try:
            return self.s3.url(name)
        except Exception:
            logger.warning("S3 url failed for %s, using local url", name)
            return super().url(name)

    def delete(self, name):
        try:
            super().delete(name)
        except Exception:
            logger.warning("Local delete failed for %s", name)
        try:
            self.s3.delete(name)
        except Exception:
            logger.warning("S3 delete failed for %s", name)

    def size(self, name):
        if super().exists(name):
            return super().size(name)
        try:
            return self.s3.size(name)
        except Exception:
            return super().size(name)
