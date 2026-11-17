import ipaddress
import socket
from urllib.parse import urlparse
import os
import re
import uuid
import logging
from typing import Tuple, Optional

logger = logging.getLogger("truthlens.ai.security")

class SSRFProtection:
    BLOCKED_NETWORKS = [
        ipaddress.ip_network("0.0.0.0/8"),          # Current network
        ipaddress.ip_network("10.0.0.0/8"),         # Private-use (Class A)
        ipaddress.ip_network("127.0.0.0/8"),        # Loopback
        ipaddress.ip_network("169.254.0.0/16"),     # Link-local (Cloud metadata)
        ipaddress.ip_network("172.16.0.0/12"),      # Private-use (Class B)
        ipaddress.ip_network("192.168.0.0/16"),     # Private-use (Class C)
        ipaddress.ip_network("224.0.0.0/4"),        # Multicast
        ipaddress.ip_network("240.0.0.0/4"),        # Reserved
        ipaddress.ip_network("::1/128"),            # IPv6 loopback
        ipaddress.ip_network("fc00::/7"),           # IPv6 unique local
        ipaddress.ip_network("fe80::/10")           # IPv6 link-local
    ]

    BLOCKED_HOSTNAMES = {
        "localhost", 
        "127.0.0.1", 
        "::1", 
        "metadata.google.internal",
        "instance-data",
        "169.254.169.254"
    }

    MAX_RESPONSE_BYTES = 5 * 1024 * 1024  # 5 MB stream limit to prevent zip bombs/DoS
    MAX_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB limit for uploaded images
    ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
    ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}

    @classmethod
    def is_safe_url(cls, url: str) -> bool:
        if not url or not isinstance(url, str):
            return False

        try:
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https"):
                return False

            hostname = parsed.hostname
            if not hostname:
                return False

            # Block localhost and cloud metadata keywords
            if hostname.lower() in cls.BLOCKED_HOSTNAMES or hostname.endswith(".internal"):
                return False

            # Resolve DNS to IP
            try:
                ip_strings = socket.getaddrinfo(hostname, None)
            except Exception:
                # If DNS fails to resolve, consider it not fetchable
                return False

            for item in ip_strings:
                ip_str = item[4][0]
                ip_obj = ipaddress.ip_address(ip_str)

                # Check against blocked CIDR blocks
                for blocked_net in cls.BLOCKED_NETWORKS:
                    if ip_obj in blocked_net:
                        logger.warning("Blocked potential SSRF access to %s (%s)", hostname, ip_str)
                        return False

            return True
        except Exception as e:
            logger.warning("URL safety check failed: %s", type(e).__name__)
            return False

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """
        Sanitize uploaded filename to prevent directory traversal and code execution.
        Generates a secure UUID prefix.
        """
        base = os.path.basename(filename or "upload.jpg")
        # Remove any non-alphanumeric chars except dots and dashes
        clean_base = re.sub(r'[^a-zA-Z0-9_\.-]', '_', base)
        ext = os.path.splitext(clean_base)[1].lower()
        if ext not in cls.ALLOWED_IMAGE_EXTENSIONS:
            ext = ".jpg"
        return f"{uuid.uuid4().hex[:12]}_{clean_base}"

is_safe_url = SSRFProtection.is_safe_url
sanitize_filename = SSRFProtection.sanitize_filename
