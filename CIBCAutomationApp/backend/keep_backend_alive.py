import schedule
import time
import requests
from read_config import debug, port
from time import strftime

def keep_alive():
    try:
        response = requests.get(f'http://localhost:{port}/keep_alive')
        if response.status_code == 200:
            print(f"{strftime('%Y-%m-%d %H:%M:%S')}: Server is alive")
        else:
            print(f'Failed to keep alive: {response.status_code}')
    except requests.RequestException as e:
        print(f'{strftime("%Y-%m-%d %H:%M:%S")}: Error during keep alive request: {e}')

# Schedule the keep_alive function to run every 5 minutes
schedule.every(5).minutes.do(keep_alive)

if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(1)
