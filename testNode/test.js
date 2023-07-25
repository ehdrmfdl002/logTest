const express = require('express');
const app = express();
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');

// Logger 설정
const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    printf(({ level, message, timestamp, userId }) => {
      return `${timestamp} [${level}] - ${message}${userId ? `, userId: ${userId}` : ''}`;
    })
  ),
  transports: [
    new transports.Console(),
  ],
});

// API 호출에 대한 로그를 파일로 저장하는 Transport 설정
const apiCallTransport = new DailyRotateFile({
  dirname: 'logs',
  filename: 'apiCall-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH-mm',
  maxSize: '5m',
  maxFiles: '30d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    printf(({ level, message, timestamp, userId }) => {
      return `${timestamp} [${level}] - ${message}${userId ? `, userId: ${userId}` : ''}`;
    })
  ),
});

app.use(express.json());

// Apply apiCallTransport only to /test POST requests
app.post('/test', async (req, res, next) => {
  const userId = req.body.userId;
  logger.info('Received request', { userId });
  apiCallTransport.log({
    level: 'info',
    message: 'Received request',
    timestamp: new Date().toISOString(),
    userId: userId,
  });

  // Await the completion of the log writing before sending the response
  await new Promise((resolve) => apiCallTransport.on('finish', resolve));
  res.status(200).json({ userId });
});



// GET endpoint
app.get('/read', (req, res) => {
  const userIdCountMap = {};
  const filePath = 'logs/apiCall.log'; // 파일 경로 예시

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading log file' });
    }

    const lines = data.split('\n');
    for (const line of lines) {
      const pattern = /(?<="userId":")[^"]+/;
      const matches = line.match(pattern);
      if (matches) {
        const userId = matches[0];
        userIdCountMap[userId] = (userIdCountMap[userId] || 0) + 1;
      }
    }

    res.status(200).json(userIdCountMap);
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
