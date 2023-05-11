# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import re


def valid_url(url: str) -> bool:
    # This is copied from django url validation regex.
    # Source: https://github.com/django/django/blob/stable/1.3.x/django/core/validators.py#L45
    regex = re.compile(
        r"^(?:http|ftp)s?://"  # http:// or https://
        # domain...
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|"
        r"localhost|"  # localhost...
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
        r"(?::\d+)?"  # optional port
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )
    return re.match(regex, url)


def get_redacted_file_name(name: str) -> str:
    tokens = name.split(".")
    tokens[0] = "redacted_" + tokens[0]
    return ".".join(tokens)


def get_page_file_name(name: str, page: int, suffix: str = None) -> str:
    if suffix is None:
        return name + "." + str(page).zfill(3)
    else:
        return name + "." + str(page).zfill(3) + suffix


def is_pdf(name: str) -> bool:
    regex = re.compile(".+(\\.pdf)$")
    return re.match(regex, name)


def is_tiff(name: str) -> bool:
    regex = re.compile(".+(\\.tiff?)$")
    return re.match(regex, name)
