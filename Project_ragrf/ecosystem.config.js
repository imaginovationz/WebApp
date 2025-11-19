// filepath: c:\Users\YadavArv\Desktop\Arvind\Repo\PythonFlaskReact\AutomationWebApp\ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'AutomationWebAppBackend',
      script: 'C:\\Users\\System_Virtualizeqc\\Desktop\\Automation_server\\AutomationWebApp\\backend\\backEnd.bat',
      interpreter: 'cmd.exe',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '1G',
      env: {
        FLASK_ENV: 'development',
      },
      env_production: {
        FLASK_ENV: 'production',
      },
    },
  ],
};