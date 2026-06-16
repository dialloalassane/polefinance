"""
brvmpy.utils.http
=================
Shared HTTP session with retry logic and appropriate headers.
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

_DEFAULT_HEADERS = {
    "User-Agent":      _USER_AGENT,
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Connection":      "keep-alive",
}


def build_session(
    retries:      int = 3,
    backoff:      float = 1.0,
    status_codes: tuple = (500, 502, 503, 504),
) -> requests.Session:
    """
    Build a requests.Session with retry logic and browser-like headers.

    Parameters
    ----------
    retries : int
        Number of retry attempts on transient errors.
    backoff : float
        Backoff factor between retries.
    status_codes : tuple
        HTTP status codes that trigger a retry.

    Returns
    -------
    requests.Session
    """
    session = requests.Session()
    session.headers.update(_DEFAULT_HEADERS)

    retry_strategy = Retry(
        total=retries,
        backoff_factor=backoff,
        status_forcelist=list(status_codes),
        allowed_methods=["GET", "POST"],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://",  adapter)

    return session
