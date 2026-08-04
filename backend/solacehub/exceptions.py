import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Return JSON for every API error, including unexpected server errors.

    Without this, unhandled exceptions render Django's HTML 500 page, which the
    frontend cannot parse and surfaces as 'Unexpected token <'.
    """
    response = exception_handler(exc, context)
    if response is not None:
        return response

    logger.exception("Unhandled API exception")
    return Response(
        {'error': f'Server error: {exc}'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
