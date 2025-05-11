### Backend for Api Testing Tools

# env file items:
DB_URL=postgresql://your_username:your_password@your_host:your_port/my_database
DB_NAME=my_database

# this the backend project with endpoints:
POST /request
Sends an HTTP request (GET, POST, PUT, DELETE) to a user-defined URL and logs the request and response data.

POST /log
Manually logs a custom HTTP request and response payload to the database.

GET /log?page=1&limit=10
Fetches paginated request logs from the database to support efficient viewing of large datasets.
