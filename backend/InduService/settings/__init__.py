# backend/InduService/settings/__init__.py
from .base import *

try:
    from .local import *
except ImportError:
    pass