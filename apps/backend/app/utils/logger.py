import logging
import os

LOG_FORMAT = "[%(asctime)s] %(levelname)s | %(name)s | %(module)s:%(lineno)d | %(message)s"
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "app.log")

os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("taskforge-backend")
logger.setLevel(logging.INFO)
logger.propagate = True  

# File handler
file_handler = logging.FileHandler(LOG_FILE)
file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
logger.addHandler(file_handler)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter(LOG_FORMAT))
logger.addHandler(console_handler)