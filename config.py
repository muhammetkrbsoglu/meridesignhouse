"""
PTT Scraper Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # PTT Website
    PTT_URL = "https://postakodu.ptt.gov.tr/"
    
    # Browser Settings
    HEADLESS = os.getenv('HEADLESS', 'True').lower() == 'true'
    WINDOW_SIZE = (1920, 1080)
    USER_DATA_DIR = os.getenv('USER_DATA_DIR', './browser_data')
    
    # Anti-Detection Settings
    RANDOM_USER_AGENT = True
    RANDOM_SCREEN_SIZE = True
    DISABLE_IMAGES = False
    DISABLE_CSS = False
    DISABLE_JS = False
    
    # Proxy Settings
    USE_PROXY = os.getenv('USE_PROXY', 'False').lower() == 'true'
    PROXY_LIST = [
        # Add your proxy list here
        # "http://user:pass@proxy1:port",
        # "http://user:pass@proxy2:port",
    ]
    
    # Timing Settings
    MIN_DELAY = 1.0
    MAX_DELAY = 3.0
    PAGE_LOAD_TIMEOUT = 30
    ELEMENT_WAIT_TIMEOUT = 10
    AJAX_WAIT_TIMEOUT = 15
    
    # Retry Settings
    MAX_RETRIES = 3
    RETRY_DELAY = 5.0
    
    # Data Settings
    OUTPUT_DIR = './data/ptt'
    LOG_DIR = './logs'
    BACKUP_DIR = './backups'
    
    # Logging
    LOG_LEVEL = 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Data Validation
    MIN_ADDRESSES_PER_MAHALLE = 1
    MAX_DUPLICATE_RATIO = 0.1
    
    # Performance
    MAX_CONCURRENT_REQUESTS = 1
    BATCH_SIZE = 100
